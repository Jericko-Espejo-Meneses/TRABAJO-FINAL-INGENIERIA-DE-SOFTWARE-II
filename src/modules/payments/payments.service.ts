import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Payment, PaymentMethodType, PaymentStatusType } from './entities/payment.entity';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { OrderStatus } from '../orders/entities/order.entity';
import { DonationsService } from '../donations/donations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementsService } from '../achievements/achievements.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly prisma: PrismaService,
    private readonly donationsService: DonationsService,
    private readonly notificationsService: NotificationsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  /**
   * HE-HU9-009: Seleccionar método de pago y procesar el pago
   * HE-HU5-005: Donación automática del 3% vinculada al pago exitoso
   */
  async processPayment(userId: string, dto: ProcessPaymentDto) {
    let order = this.db.orders.get(dto.orderId);
    if (!order && this.prisma.connected) {
      try {
        const dbOrder = await this.prisma.order.findUnique({
          where: { id: dto.orderId },
          include: { tracking: true },
        });
        if (dbOrder) {
          let timeline: any[] = [];
          try {
            timeline = dbOrder.tracking?.timeline ? JSON.parse(dbOrder.tracking.timeline) : [];
          } catch {
            timeline = [];
          }
          order = {
            id: dbOrder.id,
            userId: dbOrder.userId,
            restaurantId: dbOrder.restaurantId,
            restaurantName: dbOrder.restaurantName,
            items: [],
            subtotal: dbOrder.subtotal,
            deliveryFee: dbOrder.deliveryFee,
            total: dbOrder.total,
            totalNutrition: {
              calories: dbOrder.totalCalories ?? 0,
              proteinGrams: dbOrder.totalProtein ?? 0,
              carbsGrams: dbOrder.totalCarbs ?? 0,
              fatGrams: dbOrder.totalFat ?? 0,
              fiberGrams: 0,
            },
            deliveryAddress: { street: dbOrder.deliveryAddress, city: 'Lima' },
            contactPhone: dbOrder.contactPhone || undefined,
            status: dbOrder.status as OrderStatus,
            tracking: {
              currentStatus: (dbOrder.tracking?.currentStatus as OrderStatus) || (dbOrder.status as OrderStatus),
              progressPercentage: dbOrder.tracking?.progressPercentage ?? 30,
              estimatedDeliveryTimeMinutes: dbOrder.tracking?.estimatedDeliveryMinutes ?? 30,
              driverName: dbOrder.tracking?.driverName || 'Jorge Ramírez',
              driverPhone: dbOrder.tracking?.driverPhone || '+51 981 123 456',
              vehiclePlate: dbOrder.tracking?.vehiclePlate || 'MOT-7821',
              currentCoordinates: {
                lat: dbOrder.tracking?.latitude ?? -12.112,
                lng: dbOrder.tracking?.longitude ?? -76.994,
              },
              timeline: timeline.map((t: any) => ({
                ...t,
                timestamp: new Date(t.timestamp),
              })),
            },
            createdAt: dbOrder.createdAt,
            updatedAt: dbOrder.updatedAt,
          };
          this.db.orders.set(order.id, order);
        }
      } catch {
        // fallback
      }
    }

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

    // Persistir pago en PostgreSQL (Supabase) y actualizar orden
    if (this.prisma.connected) {
      try {
        const details = JSON.stringify({
          cardLast4: payment.cardLast4,
          cardBrand: payment.cardBrand,
          digitalWalletPhone: payment.digitalWalletPhone,
          receiptNumber: payment.receiptNumber,
        });

        await this.prisma.payment.upsert({
          where: { orderId: order.id },
          update: {
            status: payment.status,
            method: payment.paymentMethod,
            amount: payment.amount,
            currency: 'PEN',
            details,
            transactionReference: payment.transactionReference,
          },
          create: {
            id: payment.id,
            orderId: order.id,
            userId: payment.userId,
            amount: payment.amount,
            currency: 'PEN',
            status: payment.status,
            method: payment.paymentMethod,
            details,
            transactionReference: payment.transactionReference,
          },
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CONFIRMED,
          },
        }).catch(() => {});

        if (order.tracking) {
          await this.prisma.orderTracking.update({
            where: { orderId: order.id },
            data: {
              currentStatus: OrderStatus.CONFIRMED,
              progressPercentage: 30,
            },
          }).catch(() => {});
        }
      } catch (err: any) {
        this.logger.warn(`No se pudo persistir el pago en PostgreSQL (Supabase): ${err.message}`);
      }
    }

    // 1. Actualizar estado del pedido a CONFIRMED
    order.status = OrderStatus.CONFIRMED;
    order.paymentId = payment.id;
    if (order.tracking) {
      order.tracking.currentStatus = OrderStatus.CONFIRMED;
      order.tracking.progressPercentage = 30;

      // Actualizar timeline
      const confirmedStep = order.tracking.timeline?.find((s) => s.status === OrderStatus.CONFIRMED);
      if (confirmedStep) {
        confirmedStep.completed = true;
        confirmedStep.timestamp = new Date();
      }
    }

    // 2. HE-HU5-005: Generar la donación automática
    const donation = await this.donationsService.processAutomaticDonation(
      order,
      dto.preferredFoundationId,
    );
    order.donationId = donation.id;
    order.donation = donation;
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
    // Intentar leer desde PostgreSQL primero si Prisma está disponible
    if (this.prisma.connected) {
      try {
        const dbPayment = await this.prisma.payment.findFirst({
          where: { orderId, userId },
        });

        if (dbPayment) {
          const payment = this.mapDbPaymentToEntity(dbPayment);
          this.db.payments.set(payment.id, payment);
          return payment;
        }
      } catch (err: any) {
        this.logger.warn(`No se pudo consultar comprobante en PostgreSQL: ${err.message}`);
      }
    }

    // Fallback al almacén en memoria
    const payment = Array.from(this.db.payments.values()).find(
      (p) => p.orderId === orderId && p.userId === userId,
    );
    if (!payment) {
      throw new NotFoundException(`Comprobante de pago para la orden "${orderId}" no encontrado`);
    }
    return payment;
  }

  private mapDbPaymentToEntity(dbPayment: any): Payment {
    let details: Record<string, any> = {};
    if (dbPayment.details) {
      try {
        details = typeof dbPayment.details === 'string'
          ? JSON.parse(dbPayment.details)
          : dbPayment.details;
      } catch {
        details = {};
      }
    }

    let status: PaymentStatusType = 'APPROVED';
    if (dbPayment.status === 'REJECTED') {
      status = 'REJECTED';
    } else if (dbPayment.status === 'PENDING') {
      status = 'PENDING';
    } else {
      status = 'APPROVED';
    }

    return {
      id: dbPayment.id,
      orderId: dbPayment.orderId,
      userId: dbPayment.userId,
      amount: dbPayment.amount,
      paymentMethod: (dbPayment.method as PaymentMethodType) || 'credit_card',
      status,
      cardLast4: details.cardLast4,
      cardBrand: details.cardBrand,
      digitalWalletPhone: details.digitalWalletPhone,
      transactionReference: dbPayment.transactionReference || '',
      receiptNumber: details.receiptNumber || `REC-${new Date(dbPayment.createdAt).getFullYear()}${String(Date.now()).slice(-6)}`,
      processedAt: dbPayment.createdAt ? new Date(dbPayment.createdAt) : new Date(),
    };
  }
}
