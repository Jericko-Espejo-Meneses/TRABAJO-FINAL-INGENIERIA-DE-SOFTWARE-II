import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Donation, Foundation } from './entities/donation.entity';
import { Order } from '../orders/entities/order.entity';
import { v4 as uuidv4 } from 'uuid';

export interface UserSocialImpact {
  totalDonated: number;
  totalMealsEquivalent: number;
  totalDonationCount: number;
  beneficiaryFoundations: Array<{
    foundationId: string;
    foundationName: string;
    totalAmount: number;
    donationsCount: number;
  }>;
  recentDonations: Donation[];
}

@Injectable()
export class DonationsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * HE-HU5-005: Donación automática de un porcentaje de la compra (3% por defecto sin costo extra para el usuario)
   */
  async processAutomaticDonation(order: Order, preferredFoundationId?: string): Promise<Donation> {
    // Seleccionar fundación preferida o la primera disponible por defecto
    let foundation: Foundation | undefined;
    if (preferredFoundationId) {
      foundation = this.db.foundations.get(preferredFoundationId);
    }
    if (!foundation) {
      foundation = Array.from(this.db.foundations.values())[0];
    }

    const percentage = 3; // 3% donado automáticamente por HealthExpress
    const donationAmount = Math.round((order.total * (percentage / 100)) * 100) / 100;
    // Cada S/ 2.50 equivale a 1 ración alimenticia nutritiva donada
    const mealsEquivalent = Math.max(1, Math.round((donationAmount / 2.5) * 10) / 10);

    const donation: Donation = {
      id: `don-${uuidv4().substring(0, 8)}`,
      orderId: order.id,
      userId: order.userId,
      foundationId: foundation.id,
      foundationName: foundation.name,
      orderTotal: order.total,
      percentage,
      donationAmount,
      mealsEquivalent,
      createdAt: new Date(),
    };

    // Actualizar fondo acumulado de la fundación
    foundation.totalRaised = Math.round((foundation.totalRaised + donationAmount) * 100) / 100;
    this.db.foundations.set(foundation.id, foundation);
    this.db.donations.set(donation.id, donation);

    return donation;
  }

  /**
   * HE-HU6-006: Panel de impacto social del usuario (total donado, raciones equivalentes, causas apoyadas)
   */
  async getUserImpact(userId: string): Promise<UserSocialImpact> {
    const userDonations = Array.from(this.db.donations.values()).filter(
      (d) => d.userId === userId,
    );

    let totalDonated = 0;
    let totalMealsEquivalent = 0;
    const foundationMap = new Map<string, { foundationId: string; foundationName: string; totalAmount: number; donationsCount: number }>();

    for (const d of userDonations) {
      totalDonated += d.donationAmount;
      totalMealsEquivalent += d.mealsEquivalent;

      const existing = foundationMap.get(d.foundationId);
      if (existing) {
        existing.totalAmount = Math.round((existing.totalAmount + d.donationAmount) * 100) / 100;
        existing.donationsCount += 1;
      } else {
        foundationMap.set(d.foundationId, {
          foundationId: d.foundationId,
          foundationName: d.foundationName,
          totalAmount: d.donationAmount,
          donationsCount: 1,
        });
      }
    }

    userDonations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      totalDonated: Math.round(totalDonated * 100) / 100,
      totalMealsEquivalent: Math.round(totalMealsEquivalent * 10) / 10,
      totalDonationCount: userDonations.length,
      beneficiaryFoundations: Array.from(foundationMap.values()),
      recentDonations: userDonations.slice(0, 10),
    };
  }

  /**
   * HE-HU6-006: Historial detallado de donaciones del usuario
   */
  async getUserDonations(userId: string): Promise<Donation[]> {
    return Array.from(this.db.donations.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFoundations(): Promise<Foundation[]> {
    return Array.from(this.db.foundations.values());
  }

  async getFoundationById(id: string): Promise<Foundation> {
    const f = this.db.foundations.get(id);
    if (!f) {
      throw new NotFoundException(`Fundación con ID ${id} no encontrada`);
    }
    return f;
  }
}
