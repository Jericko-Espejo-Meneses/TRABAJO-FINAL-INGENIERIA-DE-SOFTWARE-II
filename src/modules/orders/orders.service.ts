import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Order, OrderStatus, OrderTracking } from './entities/order.entity';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DonationsService } from '../donations/donations.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cartService: CartService,
    private readonly notificationsService: NotificationsService,
    private readonly donationsService: DonationsService,
  ) {}

  /**
   * HE-HU8-008: Confirmar pedido a partir del carrito
   */
  async checkoutFromCart(userId: string, dto: CheckoutOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío. Agregue productos antes de confirmar el pedido.');
    }

    if (!cart.restaurantId) {
      throw new BadRequestException('El carrito no tiene un restaurante asociado válido.');
    }

    const orderId = `order-${Date.now().toString().slice(-6)}`;

    const initialTracking: OrderTracking = {
      currentStatus: OrderStatus.PENDING_PAYMENT,
      progressPercentage: 15,
      estimatedDeliveryTimeMinutes: 35,
      driverName: 'Repartidor por asignar',
      driverPhone: '+51 900 000 000',
      vehiclePlate: '---',
      currentCoordinates: { lat: -12.115, lng: -77.028 },
      timeline: [
        {
          status: OrderStatus.PENDING_PAYMENT,
          label: 'Pendiente de Pago',
          timestamp: new Date(),
          completed: true,
          description: 'Tu pedido ha sido creado. Esperando confirmación del pago.',
        },
        {
          status: OrderStatus.CONFIRMED,
          label: 'Pedido Confirmado',
          timestamp: new Date(Date.now() + 2 * 60000),
          completed: false,
          description: 'El restaurante ha recibido la comanda y comenzará la preparación.',
        },
        {
          status: OrderStatus.PREPARING,
          label: 'En Preparación Nutritiva',
          timestamp: new Date(Date.now() + 10 * 60000),
          completed: false,
          description: 'El chef está elaborando tus platillos saludables con ingredientes frescos.',
        },
        {
          status: OrderStatus.ON_THE_WAY,
          label: 'Repartidor en Camino',
          timestamp: new Date(Date.now() + 25 * 60000),
          completed: false,
          description: 'Tu comida saludable va en camino a tu dirección.',
        },
        {
          status: OrderStatus.DELIVERED,
          label: 'Entregado',
          timestamp: new Date(Date.now() + 35 * 60000),
          completed: false,
          description: '¡Disfruta tu comida saludable y balanceada!',
        },
      ],
    };

    const order: Order = {
      id: orderId,
      userId,
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName || 'Restaurante HealthExpress',
      items: [...cart.items],
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      total: cart.total,
      totalNutrition: { ...cart.totalNutrition },
      deliveryAddress: {
        street: dto.street,
        city: dto.city,
        reference: dto.reference,
        notes: dto.notes,
      },
      contactPhone: dto.contactPhone,
      status: OrderStatus.PENDING_PAYMENT,
      tracking: initialTracking,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.orders.set(order.id, order);

    // Vaciar el carrito tras generar la orden exitosamente
    await this.cartService.clearCart(userId);

    // Notificar al usuario (HE-HU7-007)
    await this.notificationsService.createNotification(
      userId,
      '🛒 Pedido generado',
      `Tu pedido #${order.id} por un total de S/ ${order.total} ha sido generado. Procede con el pago para comenzar la preparación.`,
      'ORDER_UPDATE',
      { orderId: order.id },
    );

    return order;
  }

  /**
   * Conexión Frontend: Creación directa de orden con ítems, pago y donación automática (HE-HU8-008 & HE-HU9-009 & HE-HU5-005)
   */
  async createDirectOrder(userId: string, data: any): Promise<Order> {
    const restaurantId = data.restaurantId || data.idRestaurante || 'rest-1';
    const rest = this.db.restaurants.get(restaurantId);
    const restaurantName = rest?.name || data.restaurantName || 'GreenBowl Healthy Bar';

    const rawItems = data.items || data.productos || [];
    const items = rawItems.map((i: any) => {
      const menuItemId = i.menuItemId || i.dishId || i.idProducto || 'menu-1';
      const menuItem = this.db.menuItems.get(menuItemId);
      const name = i.name || i.nombre || menuItem?.name || 'Plato Saludable';
      const price = Number(i.unitPrice || i.precio || i.price || menuItem?.price || 25);
      const quantity = Number(i.quantity || i.cantidad || 1);
      return {
        id: `item-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`,
        menuItemId,
        name,
        price,
        quantity,
        imageUrl: menuItem?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        restaurantId,
        restaurantName,
        nutritionalInfo: menuItem?.nutritionalInfo || { calories: 350, proteinGrams: 25, carbsGrams: 30, fatGrams: 10 },
        lineTotal: price * quantity,
      };
    });

    const subtotal = data.subtotal ? Number(data.subtotal) : items.reduce((sum: number, it: any) => sum + it.lineTotal, 0);
    const deliveryFee = rest?.deliveryFee || 4.5;
    const total = data.total ? Number(data.total) : subtotal + deliveryFee;

    const orderId = `HE-${Date.now().toString().slice(-6)}`;

    const deliveryAddressStr = typeof data.deliveryAddress === 'string'
      ? data.deliveryAddress
      : data.direccionEntrega || data.deliveryAddress?.street || 'Av. Principal 123';

    const order: Order = {
      id: orderId,
      userId,
      restaurantId,
      restaurantName,
      items,
      subtotal,
      deliveryFee,
      total,
      totalNutrition: {
        calories: items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo.calories || 0) * it.quantity, 0),
        proteinGrams: items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo.proteinGrams || 0) * it.quantity, 0),
        carbsGrams: items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo.carbsGrams || 0) * it.quantity, 0),
        fatGrams: items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo.fatGrams || 0) * it.quantity, 0),
      },
      deliveryAddress: {
        street: deliveryAddressStr,
        city: 'Lima',
      },
      contactPhone: data.contactPhone || '+51987654321',
      status: OrderStatus.CONFIRMED,
      tracking: {
        currentStatus: OrderStatus.CONFIRMED,
        progressPercentage: 30,
        estimatedDeliveryTimeMinutes: 30,
        driverName: 'Jorge Ramírez',
        driverPhone: '+51 981 123 456',
        vehiclePlate: 'MOT-7821',
        currentCoordinates: { lat: -12.112, lng: -76.994 },
        timeline: [
          {
            status: OrderStatus.CONFIRMED,
            label: 'Pedido confirmado',
            timestamp: new Date(),
            completed: true,
            description: 'El restaurante ha recibido y confirmado tu pedido.',
          },
          {
            status: OrderStatus.PREPARING,
            label: 'Preparando alimentos',
            timestamp: new Date(Date.now() + 5 * 60000),
            completed: false,
            description: 'El chef está elaborando tus platillos con ingredientes frescos.',
          },
          {
            status: OrderStatus.ON_THE_WAY,
            label: 'Repartidor en camino',
            timestamp: new Date(Date.now() + 20 * 60000),
            completed: false,
            description: 'El repartidor va en camino a tu dirección.',
          },
          {
            status: OrderStatus.DELIVERED,
            label: 'Entregado',
            timestamp: new Date(Date.now() + 30 * 60000),
            completed: false,
            description: 'Pedido entregado en tu puerta.',
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.orders.set(order.id, order);

    // Donación automática vinculada (HE-HU5-005)
    const donation = await this.donationsService.processAutomaticDonation(order);
    order.donationId = donation.id;

    // Crear notificación (HE-HU7-007)
    await this.notificationsService.createNotification(
      userId,
      `🎉 ¡Pedido #${order.id} confirmado!`,
      `Tu pedido en ${order.restaurantName} ha sido confirmado. Se donaron S/ ${donation.donationAmount} al Banco de Alimentos.`,
      'ORDER_UPDATE',
      { orderId: order.id },
    );

    return order;
  }

  /**
   * HE-HU6-006: Historial de pedidos del usuario
   */
  async getOrderHistory(userId: string): Promise<Order[]> {
    return Array.from(this.db.orders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obtener detalle de pedido por ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<Order> {
    const order = this.db.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Pedido con ID "${orderId}" no encontrado`);
    }

    if (userId && order.userId !== userId) {
      throw new NotFoundException(`No tienes permisos para ver el pedido "${orderId}"`);
    }

    return order;
  }

  /**
   * HE-HU13-013: Visualizar en tiempo real el estado de mi pedido
   */
  async trackOrder(orderId: string, userId: string): Promise<OrderTracking & { orderId: string; total: number; restaurantName: string }> {
    const order = await this.getOrderById(orderId, userId);

    return {
      orderId: order.id,
      total: order.total,
      restaurantName: order.restaurantName,
      ...order.tracking,
    };
  }

  /**
   * Simulación de avance en tiempo real para el seguimiento del pedido (HE-HU13-013)
   */
  async advanceOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const order = this.db.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Pedido con ID "${orderId}" no encontrado`);
    }

    order.status = newStatus;
    order.tracking.currentStatus = newStatus;

    // Actualizar progreso y datos de conductor según estado
    switch (newStatus) {
      case OrderStatus.CONFIRMED:
        order.tracking.progressPercentage = 30;
        order.tracking.estimatedDeliveryTimeMinutes = 30;
        break;
      case OrderStatus.PREPARING:
        order.tracking.progressPercentage = 50;
        order.tracking.estimatedDeliveryTimeMinutes = 20;
        break;
      case OrderStatus.ON_THE_WAY:
        order.tracking.progressPercentage = 80;
        order.tracking.estimatedDeliveryTimeMinutes = 10;
        order.tracking.driverName = 'Rodrigo Vásquez';
        order.tracking.driverPhone = '+51 987 111 222';
        order.tracking.vehiclePlate = 'MOT-9912';
        order.tracking.currentCoordinates = { lat: -12.118, lng: -77.012 };
        break;
      case OrderStatus.DELIVERED:
        order.tracking.progressPercentage = 100;
        order.tracking.estimatedDeliveryTimeMinutes = 0;
        break;
      case OrderStatus.CANCELLED:
        order.tracking.progressPercentage = 0;
        break;
    }

    // Actualizar timeline
    for (const step of order.tracking.timeline) {
      if (step.status === newStatus) {
        step.completed = true;
        step.timestamp = new Date();
        break;
      } else {
        step.completed = true;
      }
    }

    order.updatedAt = new Date();
    this.db.orders.set(orderId, order);

    // Notificar al usuario (HE-HU7-007)
    await this.notificationsService.createNotification(
      order.userId,
      `🛵 Actualización de tu pedido #${order.id}`,
      `El estado de tu pedido cambió a: ${newStatus}`,
      'ORDER_UPDATE',
      { orderId, status: newStatus },
    );

    return order;
  }
}
