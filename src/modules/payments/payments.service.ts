import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Payment } from './entities/payment.entity';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { OrderStatus } from '../orders/entities/order.entity';
import { DonationsService } from '../donations/donations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementsService } from '../achievements/achievements.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly donationsService: DonationsService,
    private readonly notificationsService: NotificationsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  /**
   * HE-HU9-009: Seleccionar método de pago y procesar el pago
   * HE-HU5-005: Donación automática del 3% vinculada al pago exitoso
   */
  async processPayment(userId: string, dto: ProcessPaymentDto) {
    const order = this.db.orders.get(dto.orderId);
    if (!order) {
      throw new NotFoundException(`Pedido con ID "${dto.orderId}" no encontrado`);
    }

    if (order.userId !== userId) {
      throw new BadRequestException('El pedido no pertenece al usuario autenticado');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`El pedido ya se encuentra en estado "${order.status}"`);
    }

    // Validación simulada según el método de pago seleccionado
    if (['credit_card', 'debit_card'].includes(dto.paymentMethod)) {
      if (!dto.cardNumber || dto.cardNumber.length < 13) {
        throw new BadRequestException('Número de tarjeta no válido');
      }
    } else if (['yape', 'plin'].includes(dto.paymentMethod)) {
      if (!dto.walletPhone || dto.walletPhone.length < 9) {
        throw new BadRequestException('Número de billetera digital no válido');
      }
    }

    const paymentId = `pay-${uuidv4().substring(0, 8)}`;
    const cardLast4 = dto.cardNumber ? dto.cardNumber.slice(-4) : undefined;
    const receiptNumber = `REC-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;

    const payment: Payment = {
      id: paymentId,
      orderId: order.id,
      userId,
      amount: order.total,
      paymentMethod: dto.paymentMethod,
      status: 'APPROVED',
      cardLast4,
      cardBrand: dto.cardNumber ? 'Visa/Mastercard' : undefined,
      digitalWalletPhone: dto.walletPhone,
      transactionReference: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      receiptNumber,
      processedAt: new Date(),
    };

    this.db.payments.set(payment.id, payment);

    // 1. Actualizar estado del pedido a CONFIRMED
    order.status = OrderStatus.CONFIRMED;
    order.paymentId = payment.id;
    order.tracking.currentStatus = OrderStatus.CONFIRMED;
    order.tracking.progressPercentage = 30;

    // Actualizar timeline
    const confirmedStep = order.tracking.timeline.find((s) => s.status === OrderStatus.CONFIRMED);
    if (confirmedStep) {
      confirmedStep.completed = true;
      confirmedStep.timestamp = new Date();
    }

    // 2. HE-HU5-005: Generar la donación automática
    const donation = await this.donationsService.processAutomaticDonation(
      order,
      dto.preferredFoundationId,
    );
    order.donationId = donation.id;
    order.updatedAt = new Date();
    this.db.orders.set(order.id, order);

    // 3. Incrementar logros del usuario (Sprint 6: HE-HU7-007)
    await this.achievementsService.incrementProgress(userId, 'ach-1', 1); // Primer pedido
    await this.achievementsService.incrementProgress(userId, 'ach-2', 1); // Impacto social
    await this.achievementsService.incrementProgress(userId, 'ach-4', 1); // Constancia Fit

    // 4. Notificar al usuario sobre pago y donación
    await this.notificationsService.createNotification(
      userId,
      '✅ ¡Pago aprobado con éxito!',
      `Hemos recibido tu pago de S/ ${payment.amount} con ${dto.paymentMethod}. Tu comida saludable ya está en camino a preparación.`,
      'ORDER_UPDATE',
      { orderId: order.id, paymentId: payment.id },
    );

    await this.notificationsService.createNotification(
      userId,
      '💚 Donación automática generada',
      `Gracias a tu compra, HealthExpress ha donado S/ ${donation.donationAmount} a ${donation.foundationName}.`,
      'DONATION',
      { donationId: donation.id },
    );

    return {
      message: 'Pago procesado exitosamente y pedido confirmado',
      payment,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        restaurantName: order.restaurantName,
      },
      donation: {
        id: donation.id,
        foundationName: donation.foundationName,
        donationAmount: donation.donationAmount,
        mealsEquivalent: donation.mealsEquivalent,
      },
    };
  }

  async getPaymentByOrder(orderId: string, userId: string): Promise<Payment> {
    const payment = Array.from(this.db.payments.values()).find(
      (p) => p.orderId === orderId && p.userId === userId,
    );
    if (!payment) {
      throw new NotFoundException(`Comprobante de pago para la orden "${orderId}" no encontrado`);
    }
    return payment;
  }
}
