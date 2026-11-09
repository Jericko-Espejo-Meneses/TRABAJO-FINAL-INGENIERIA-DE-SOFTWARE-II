import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
  constructor(private readonly db: DatabaseService, @Optional() private readonly prisma?: PrismaService) {}

  private fromDatabase(row: any): Donation {
    return { id: row.id, orderId: row.orderId, userId: row.userId,
      foundationId: row.foundationId, foundationName: row.foundation.name,
      orderTotal: row.orderTotal, percentage: row.percentage,
      donationAmount: row.amount, mealsEquivalent: row.mealsEquivalent, createdAt: row.createdAt };
  }

  /**
   * HE-HU5-005: Donación automática de un porcentaje de la compra (3% por defecto sin costo extra para el usuario)
   */
  async processAutomaticDonation(order: Order, preferredFoundationId?: string): Promise<Donation> {
    // Conservar la donación ya registrada: un pedido solo dona una vez.
    if (this.prisma?.connected) {
      const existing = await this.prisma.donation.findUnique({ where: { orderId: order.id }, include: { foundation: true } });
      if (existing) return this.fromDatabase(existing);
    }
    const existing = Array.from(this.db.donations.values()).find((d) => d.orderId === order.id);
    if (existing) return existing;
    const foundation = await this.getFoundationById(preferredFoundationId ?? 'found-wfp');

    const percentage = 3; // 3% donado automáticamente por HealthExpress
    const donationAmount = Math.round((order.total * (percentage / 100)) * 100) / 100;
    // Cada S/ 2.50 equivale a 1 ración alimenticia nutritiva donada
    const mealsEquivalent = Math.floor(donationAmount / 2.5);

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

    if (this.prisma?.connected) {
      await this.prisma.foundation.upsert({
        where: { id: foundation.id }, update: {},
        create: { id: foundation.id, name: foundation.name, description: foundation.description, logoUrl: foundation.logoUrl },
      });
      await this.prisma.donation.create({ data: {
        id: donation.id, orderId: order.id, userId: order.userId,
        foundationId: foundation.id, amount: donationAmount, percentage,
        orderTotal: order.total, mealsEquivalent,
      } });
    }
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
    const userDonations = await this.getUserDonations(userId);

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
    if (this.prisma?.connected) {
      const rows = await this.prisma.donation.findMany({ where: { userId }, include: { foundation: true }, orderBy: { createdAt: 'desc' } });
      return rows.map((row) => this.fromDatabase(row));
    }
    return Array.from(this.db.donations.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFoundations(): Promise<Foundation[]> {
    if (this.prisma?.connected) {
      try {
        const rows = await this.prisma.foundation.findMany({ where: { isActive: true } });
        if (rows.length > 0) {
          return rows.map((f: any) => ({
            id: f.id,
            name: f.name,
            cause: f.mission || f.description,
            description: f.description,
            logoUrl: f.logoUrl,
            totalRaised: 0,
          }));
        }
      } catch {
        // fallback
      }
    }
    return Array.from(this.db.foundations.values());
  }

  async getFoundationById(id: string): Promise<Foundation> {
    const f = this.db.foundations.get(id);
    if (f) return f;

    if (this.prisma?.connected) {
      try {
        const row = await this.prisma.foundation.findUnique({ where: { id } });
        if (row) {
          return {
            id: row.id,
            name: row.name,
            cause: row.mission || row.description,
            description: row.description,
            logoUrl: row.logoUrl,
            totalRaised: 0,
          };
        }
      } catch {
        // fallback
      }
    }

    throw new NotFoundException(`Fundación con ID ${id} no encontrada`);
  }
}
