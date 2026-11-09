import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';
import { DonationsService } from '../donations/donations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementsService } from '../achievements/achievements.service';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '../orders/entities/order.entity';

describe('PaymentsService (Sprint 4: HE-HU9-009 & HE-HU5-005)', () => {
  let paymentsService: PaymentsService;
  let ordersService: OrdersService;
  let cartService: CartService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        OrdersService,
        CartService,
        DonationsService,
        NotificationsService,
        AchievementsService,
        DatabaseService,
        {
          provide: PrismaService,
          useValue: {
            connected: false,
            order: { findMany: jest.fn().mockResolvedValue([]), upsert: jest.fn(), update: jest.fn() },
            orderTracking: { update: jest.fn() },
            user: { findUnique: jest.fn(), create: jest.fn() },
            restaurant: { findUnique: jest.fn(), create: jest.fn() },
          },
        },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    ordersService = module.get<OrdersService>(OrdersService);
    cartService = module.get<CartService>(CartService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('HE-HU9-009: debe procesar el pago con tarjeta, confirmar la orden y generar donación automática (HE-HU5-005)', async () => {
    // 1. Crear orden
    await cartService.addItem('test-pay-user', {
      menuItemId: 'menu-1',
      quantity: 1,
    });
    const order = await ordersService.checkoutFromCart('test-pay-user', {
      street: 'Av. Larco 100',
      city: 'Miraflores',
      contactPhone: '+51988776655',
      preferredFoundationId: 'found-1',
    });

    // 2. Procesar pago
    const result = await paymentsService.processPayment('test-pay-user', {
      orderId: order.id,
      paymentMethod: 'credit_card',
      cardNumber: '4242424242424242',
      cardHolderName: 'Test User',
      cardExpiration: '12/28',
      cardCvv: '123',
    });

    expect(result).toBeDefined();
    expect(result.payment.status).toBe('APPROVED');
    expect(result.order.status).toBe(OrderStatus.CONFIRMED);
    // Donación automática
    expect(result.donation).toBeDefined();
    expect(result.donation.donationAmount).toBeGreaterThan(0);
    expect(result.donation.foundationName).toBe('World Food Programme (WFP)');
  });

  it('HE-HU9-009: debe procesar el pago con billetera digital Yape', async () => {
    await cartService.addItem('test-yape-user', {
      menuItemId: 'menu-1',
      quantity: 1,
    });
    const order = await ordersService.checkoutFromCart('test-yape-user', {
      street: 'Av. Larco 100',
      city: 'Miraflores',
      contactPhone: '+51988776655',
    });

    const result = await paymentsService.processPayment('test-yape-user', {
      orderId: order.id,
      paymentMethod: 'yape',
      walletPhone: '987654321',
      walletOtpCode: '998811',
    });

    expect(result.payment.paymentMethod).toBe('yape');
    expect(result.payment.status).toBe('APPROVED');
  });
});
