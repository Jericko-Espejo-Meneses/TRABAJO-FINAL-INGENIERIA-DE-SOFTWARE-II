import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { DatabaseService } from '../../database/database.service';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DonationsService } from '../donations/donations.service';
import { OrderStatus } from './entities/order.entity';
import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

describe('OrdersService (Sprint 4: HE-HU8-008 & Sprint 5: HE-HU6-006 & Sprint 7: HE-HU13-013)', () => {
  let service: OrdersService;
  let cartService: CartService;
  let db: DatabaseService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        CartService,
        NotificationsService,
        DonationsService,
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

    service = module.get<OrdersService>(OrdersService);
    cartService = module.get<CartService>(CartService);
    db = module.get<DatabaseService>(DatabaseService);
    prisma = module.get(PrismaService);
    await db.onModuleInit();
  });

  it('HE-HU8-008: debe crear un pedido a partir de los productos del carrito y vaciar el carrito', async () => {
    // 1. Añadir ítem al carrito
    await cartService.addItem('test-user-order', {
      menuItemId: 'menu-1',
      quantity: 2,
    });

    // 2. Checkout
    const order = await service.checkoutFromCart('test-user-order', {
      street: 'Av. Primavera 1234',
      city: 'Santiago de Surco',
      contactPhone: '+51987654321',
      reference: 'Frente al parque',
    });

    expect(order).toBeDefined();
    expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(order.items.length).toBe(1);
    expect(order.subtotal).toBe(57.0);
    expect(order.totalNutrition.calories).toBe(900);

    // Carrito debe quedar vacío
    const cart = await cartService.getCart('test-user-order');
    expect(cart.items.length).toBe(0);
  });

  it('HE-HU8-008: debe rechazar checkout si el carrito está vacío', async () => {
    await expect(
      service.checkoutFromCart('empty-cart-user', {
        street: 'Calle 1',
        city: 'Lima',
        contactPhone: '+51900000000',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('HE-HU6-006: debe retornar el historial de pedidos del usuario', async () => {
    const history = await service.getOrderHistory('user-demo-1');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].id).toBe('order-demo-1001');
  });

  it('HE-HU13-013: debe retornar el seguimiento y estado en tiempo real del pedido', async () => {
    const tracking = await service.trackOrder('order-demo-1001', 'user-demo-1');
    expect(tracking).toBeDefined();
    expect(tracking.currentStatus).toBe(OrderStatus.DELIVERED);
    expect(tracking.progressPercentage).toBe(100);
    expect(tracking.timeline.length).toBeGreaterThan(0);
  });

  it('HE-HU13-013: debe avanzar el estado del pedido y actualizar la línea de tiempo', async () => {
    // Crear orden previa
    await cartService.addItem('test-tracking-user', {
      menuItemId: 'menu-1',
      quantity: 1,
    });
    const order = await service.checkoutFromCart('test-tracking-user', {
      street: 'Calle Sol 400',
      city: 'Lima',
      contactPhone: '+51999888777',
    });

    const updated = await service.advanceOrderStatus(order.id, OrderStatus.ON_THE_WAY);
    expect(updated.status).toBe(OrderStatus.ON_THE_WAY);
    expect(updated.tracking.driverName).toBeDefined();
    expect(updated.tracking.progressPercentage).toBe(80);
  });

  it('debe crear pedido directo desde frontend checkout', async () => {
    const direct = await service.createDirectOrder('direct-user', {
      restaurantId: 'rest-1',
      items: [{ menuItemId: 'menu-1', quantity: 2, unitPrice: 28.5, name: 'Bowl Quinoa' }],
      subtotal: 57,
      total: 61.5,
      deliveryAddress: 'Av. Primavera 450',
    });

    expect(direct).toBeDefined();
    expect(direct.id).toContain('HE-');
    expect(direct.status).toBe(OrderStatus.CONFIRMED);
    expect(direct.donationId).toBeDefined();
    expect(direct.donation).toMatchObject({ donationAmount: 1.85, percentage: 3, foundationName: 'World Food Programme (WFP)' });
    const history = await service.getOrderHistory('direct-user');
    expect(history[0].donation).toEqual(direct.donation);
  });

  it('recupera la donación persistida con su beneficiario histórico', async () => {
    prisma.connected = true;
    prisma.order.findMany.mockResolvedValue([{
      id: 'saved-order', userId: 'saved-user', total: 50, items: [],
      donation: { id: 'saved-donation', foundationId: 'found-1', amount: 2.5,
        percentage: 5, orderTotal: 50, mealsEquivalent: 1, createdAt: new Date(),
        foundation: { name: 'Banco de Alimentos Perú' } },
    }]);
    const [order] = await service.getOrderHistory('saved-user');
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({ donation: { include: { foundation: true } } }),
    }));
    expect(order.donationId).toBe('saved-donation');
    expect(order.donation).toMatchObject({ donationAmount: 2.5, percentage: 5, foundationName: 'Banco de Alimentos Perú' });
  });
});
