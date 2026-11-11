import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Order, OrderStatus, OrderTracking } from './entities/order.entity';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CartService } from '../cart/cart.service';
import { CartItem } from '../cart/entities/cart-item.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { DonationsService } from '../donations/donations.service';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly notificationsService: NotificationsService,
    private readonly donationsService: DonationsService,
  ) {}

  async onModuleInit() {
    await this.syncOrdersFromDatabase();
  }

  /**
   * Sincroniza las órdenes de PostgreSQL (Supabase) al almacén en memoria
   */
  async syncOrdersFromDatabase() {
    try {
      if (!this.prisma.connected) return;
      const dbOrders = await this.prisma.order.findMany({
        include: {
          items: true,
          tracking: true,
          donation: { include: { foundation: true } },
          payment: true,
        },
      });

      for (const dbo of dbOrders) {
        const orderEntity = this.mapDbOrderToEntity(dbo);
        this.db.orders.set(orderEntity.id, orderEntity);
      }
      this.logger.log(`📦 ${dbOrders.length} pedidos sincronizados desde PostgreSQL / Supabase.`);
    } catch (err: any) {
      this.logger.warn(`No se pudo sincronizar pedidos desde DB: ${err.message}`);
    }
  }

  private mapDbOrderToEntity(dbo: any): Order {
    let timeline: any[] = [];
    try {
      timeline = dbo.tracking?.timeline ? JSON.parse(dbo.tracking.timeline) : [];
    } catch {
      timeline = [];
    }

    const tracking: OrderTracking = {
      currentStatus: (dbo.tracking?.currentStatus as OrderStatus) || (dbo.status as OrderStatus),
      progressPercentage: dbo.tracking?.progressPercentage ?? 30,
      estimatedDeliveryTimeMinutes: dbo.tracking?.estimatedDeliveryMinutes ?? 30,
      driverName: dbo.tracking?.driverName || 'Jorge Ramírez',
      driverPhone: dbo.tracking?.driverPhone || '+51 981 123 456',
      vehiclePlate: dbo.tracking?.vehiclePlate || 'MOT-7821',
      currentCoordinates: {
        lat: dbo.tracking?.latitude ?? -12.112,
        lng: dbo.tracking?.longitude ?? -76.994,
      },
      timeline: timeline.map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      })),
    };

    return {
      id: dbo.id,
      userId: dbo.userId,
      restaurantId: dbo.restaurantId,
      restaurantName: dbo.restaurantName,
      items: (dbo.items || []).map((it: any) => ({
        id: it.id,
        menuItemId: it.menuItemId,
        name: it.name,
        price: it.unitPrice,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        restaurantId: dbo.restaurantId,
        restaurantName: dbo.restaurantName,
        nutritionalInfo: {
          calories: it.calories,
          proteinGrams: it.proteinGrams,
          carbsGrams: it.carbsGrams,
          fatGrams: it.fatGrams,
        },
      })),
      subtotal: dbo.subtotal,
      deliveryFee: dbo.deliveryFee,
      total: dbo.total,
      totalNutrition: {
        calories: dbo.totalCalories,
        proteinGrams: dbo.totalProtein,
        carbsGrams: dbo.totalCarbs,
        fatGrams: dbo.totalFat,
      },
      deliveryAddress: {
        street: dbo.deliveryAddress,
        city: 'Lima',
      },
      contactPhone: dbo.contactPhone,
      status: dbo.status as OrderStatus,
      tracking,
      donationId: dbo.donation?.id || dbo.donationId || undefined,
      donation: dbo.donation ? {
        id: dbo.donation.id, orderId: dbo.id, userId: dbo.userId,
        foundationId: dbo.donation.foundationId, foundationName: dbo.donation.foundation.name,
        orderTotal: dbo.donation.orderTotal, percentage: dbo.donation.percentage,
        donationAmount: dbo.donation.amount, mealsEquivalent: dbo.donation.mealsEquivalent,
        createdAt: dbo.donation.createdAt,
      } : undefined,
      createdAt: dbo.createdAt,
      updatedAt: dbo.updatedAt,
    };
  }

  /**
   * Persiste la orden en PostgreSQL (Supabase)
   */
  private async persistOrderToPrisma(order: Order) {
    try {
      if (!this.prisma.connected) return;

      // 1. Asegurar que el usuario existe en PostgreSQL
      const userExists = await this.prisma.user.findUnique({ where: { id: order.userId } });
      if (!userExists) {
        const memUser = this.db.users.get(order.userId);
        if (memUser) {
          await this.prisma.user.create({
            data: {
              id: memUser.id,
              email: memUser.email,
              passwordHash: memUser.passwordHash,
              fullName: memUser.fullName,
              phone: memUser.phone,
              provider: memUser.provider || 'email',
              dietaryPreferences: JSON.stringify(memUser.dietaryPreferences || []),
              healthGoals: JSON.stringify(memUser.healthGoals || []),
            },
          }).catch(() => {});
        }
      }

      // 2. Asegurar que el restaurante existe en PostgreSQL
      const restExists = await this.prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
      if (!restExists) {
        const memRest = this.db.restaurants.get(order.restaurantId);
        if (memRest) {
          await this.prisma.restaurant.create({
            data: {
              id: memRest.id,
              name: memRest.name,
              description: memRest.description,
              logoUrl: memRest.logoUrl,
              bannerUrl: memRest.bannerUrl,
              address: memRest.address,
              rating: memRest.rating,
              deliveryTimeMinutes: memRest.deliveryTimeMinutes,
              deliveryFee: memRest.deliveryFee,
              foodType: memRest.category || 'Saludable',
            },
          }).catch(() => {});
        }
      }

      const deliveryAddressStr = typeof order.deliveryAddress === 'string'
        ? order.deliveryAddress
        : `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || ''}`.trim() || 'Dirección de entrega';

      // 3. Crear orden en PostgreSQL
      await this.prisma.order.upsert({
        where: { id: order.id },
        update: {
          status: order.status,
          total: order.total,
        },
        create: {
          id: order.id,
          userId: order.userId,
          restaurantId: order.restaurantId,
          restaurantName: order.restaurantName,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          totalCalories: order.totalNutrition?.calories || 0,
          totalProtein: order.totalNutrition?.proteinGrams || 0,
          totalCarbs: order.totalNutrition?.carbsGrams || 0,
          totalFat: order.totalNutrition?.fatGrams || 0,
          status: order.status,
          deliveryAddress: deliveryAddressStr,
          contactPhone: order.contactPhone || '+51987654321',
          items: {
            create: (order.items || []).map((it: any) => ({
              menuItemId: it.menuItemId || null,
              name: it.name,
              unitPrice: it.unitPrice || it.price || 0,
              quantity: it.quantity || 1,
              lineTotal: it.lineTotal || ((it.unitPrice || it.price || 0) * (it.quantity || 1)),
              calories: it.nutritionalInfo?.calories || it.calories || 0,
              proteinGrams: it.nutritionalInfo?.proteinGrams || it.proteinGrams || 0,
              carbsGrams: it.nutritionalInfo?.carbsGrams || it.carbsGrams || 0,
              fatGrams: it.nutritionalInfo?.fatGrams || it.fatGrams || 0,
            })),
          },
          tracking: order.tracking ? {
            create: {
              currentStatus: order.tracking.currentStatus,
              progressPercentage: order.tracking.progressPercentage || 30,
              estimatedDeliveryMinutes: order.tracking.estimatedDeliveryTimeMinutes || 30,
              driverName: order.tracking.driverName || 'Jorge Ramírez',
              driverPhone: order.tracking.driverPhone || '+51 981 123 456',
              vehiclePlate: order.tracking.vehiclePlate || 'MOT-7821',
              latitude: order.tracking.currentCoordinates?.lat || -12.112,
              longitude: order.tracking.currentCoordinates?.lng || -76.994,
              timeline: JSON.stringify(order.tracking.timeline || []),
            },
          } : undefined,
        },
      });

      this.logger.log(`💾 Pedido #${order.id} persistido exitosamente en PostgreSQL (Supabase)`);
    } catch (err: any) {
      this.logger.error(`Error persistiendo pedido en Supabase: ${err.message}`);
      throw err;
    }
  }

  /**
   * HE-HU8-008: Confirmar pedido a partir del carrito
   * Valida rigurosamente: rechaza carritos vacíos, productos inexistentes, cantidades negativas, cero o decimales.
   * Recalcula precios, subtotales, totales y donación del 3% en backend sin confiar en frontend.
   */
  async checkoutFromCart(userId: string, dto: CheckoutOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío. Agregue productos antes de confirmar el pedido.');
    }

    if (!cart.restaurantId) {
      throw new BadRequestException('El carrito no tiene un restaurante asociado válido.');
    }

    // Validar productos existentes, cantidades válidas y recalcular precios oficiales desde el backend
    let subtotal = 0;
    const validatedItems: CartItem[] = [];

    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      if (!item || !item.menuItemId) {
        throw new BadRequestException(`El producto en la posición ${i + 1} del carrito no tiene un identificador válido.`);
      }

      let menuItem = this.db.menuItems.get(item.menuItemId.trim());
      if (!menuItem && this.prisma?.connected) {
        try {
          menuItem = (await this.prisma.menuItem.findUnique({ where: { id: item.menuItemId.trim() } })) as any;
        } catch {}
      }

      if (!menuItem) {
        throw new BadRequestException(`El producto con ID "${item.menuItemId}" no existe en el catálogo.`);
      }

      if (menuItem.isAvailable === false) {
        throw new BadRequestException(`El producto "${menuItem.name}" no está disponible en este momento.`);
      }

      const qty = Number(item.quantity);
      if (
        item.quantity === null ||
        item.quantity === undefined ||
        typeof item.quantity === 'boolean' ||
        isNaN(qty) ||
        !Number.isInteger(qty) ||
        qty <= 0
      ) {
        throw new BadRequestException(
          `La cantidad para el producto "${menuItem.name}" debe ser un número entero positivo mayor a cero (no se permiten cantidades negativas, cero o decimales).`,
        );
      }

      // Precios oficiales calculados en backend (no se confía en importes previos)
      const officialPrice = Number(menuItem.price);
      const lineTotal = Math.round(officialPrice * qty * 100) / 100;
      subtotal += lineTotal;

      validatedItems.push({
        ...item,
        name: menuItem.name,
        price: officialPrice,
        unitPrice: officialPrice,
        quantity: qty,
        lineTotal,
        nutritionalInfo: menuItem.nutritionalInfo || item.nutritionalInfo,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const rest = this.db.restaurants.get(cart.restaurantId);
    const deliveryFee = rest?.deliveryFee !== undefined ? Number(rest.deliveryFee) : 4.5;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    const donationAmount = Math.round(total * 0.03 * 100) / 100;

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
      restaurantName: cart.restaurantName || rest?.name || 'Restaurante HealthExpress',
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      donationAmount,
      donationPercentage: 3,
      totalNutrition: {
        calories: Math.round(validatedItems.reduce((sum, it) => sum + (it.nutritionalInfo?.calories || 0) * it.quantity, 0)),
        proteinGrams: Math.round(validatedItems.reduce((sum, it) => sum + (it.nutritionalInfo?.proteinGrams || 0) * it.quantity, 0) * 10) / 10,
        carbsGrams: Math.round(validatedItems.reduce((sum, it) => sum + (it.nutritionalInfo?.carbsGrams || 0) * it.quantity, 0) * 10) / 10,
        fatGrams: Math.round(validatedItems.reduce((sum, it) => sum + (it.nutritionalInfo?.fatGrams || 0) * it.quantity, 0) * 10) / 10,
      },
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

    // Persistir en PostgreSQL
    await this.persistOrderToPrisma(order);

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
   * Valida rigurosamente: rechaza carritos vacíos, productos inexistentes, cantidades negativas, cero o decimales.
   * Calcula precios, total y donación del 3% exclusivamente en el backend sin confiar en el frontend.
   */
  async createDirectOrder(userId: string, data: any): Promise<Order> {
    const rawItems = data?.items || data?.productos;
    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      throw new BadRequestException('El pedido debe contener al menos un producto (carrito vacío no permitido).');
    }

    const items: CartItem[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i];
      if (!it || typeof it !== 'object') {
        throw new BadRequestException(`El producto en la posición ${i + 1} no es válido.`);
      }

      const menuItemId = it.menuItemId || it.dishId || it.idProducto || it.id;
      if (!menuItemId || typeof menuItemId !== 'string' || !menuItemId.trim()) {
        throw new BadRequestException(`El producto en la posición ${i + 1} debe contener un identificador válido (menuItemId).`);
      }

      const trimmedId = menuItemId.trim();
      let menuItem = this.db.menuItems.get(trimmedId);
      if (!menuItem && this.prisma?.connected) {
        try {
          menuItem = (await this.prisma.menuItem.findUnique({ where: { id: trimmedId } })) as any;
        } catch {}
      }

      if (!menuItem) {
        throw new BadRequestException(`El producto con ID "${trimmedId}" no existe en el catálogo.`);
      }

      if (menuItem.isAvailable === false) {
        throw new BadRequestException(`El producto "${menuItem.name}" no está disponible en este momento.`);
      }

      const rawQty = it.quantity !== undefined ? it.quantity : it.cantidad;
      if (
        rawQty === null ||
        rawQty === undefined ||
        typeof rawQty === 'boolean' ||
        rawQty === ''
      ) {
        throw new BadRequestException(
          `La cantidad del producto "${menuItem.name}" es requerida y debe ser un número entero mayor a cero.`,
        );
      }

      const quantityNum = Number(rawQty);
      if (isNaN(quantityNum) || !Number.isInteger(quantityNum) || quantityNum <= 0) {
        throw new BadRequestException(
          `La cantidad del producto "${menuItem.name}" debe ser un número entero positivo mayor a cero (no se permiten cantidades negativas, cero o decimales). Valor recibido: ${rawQty}`,
        );
      }

      // PRECIOS: Se obtienen exclusivamente del catálogo oficial en el backend
      // Se ignora cualquier precio o importe enviado por el frontend
      const officialPrice = Number(menuItem.price);
      const lineTotal = Math.round(officialPrice * quantityNum * 100) / 100;

      items.push({
        id: `item-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: officialPrice,
        unitPrice: officialPrice,
        quantity: quantityNum,
        imageUrl: menuItem.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        restaurantId: menuItem.restaurantId,
        restaurantName: menuItem.restaurantName,
        specialInstructions: it.specialInstructions || it.instrucciones,
        nutritionalInfo: menuItem.nutritionalInfo || { calories: 350, proteinGrams: 25, carbsGrams: 30, fatGrams: 10, fiberGrams: 5 },
        lineTotal,
      });
    }

    const restaurantId = data?.restaurantId || data?.idRestaurante || items[0].restaurantId || 'rest-1';
    let rest = this.db.restaurants.get(restaurantId);
    if (!rest && this.prisma?.connected) {
      try {
        rest = (await this.prisma.restaurant.findUnique({ where: { id: restaurantId } })) as any;
      } catch {}
    }
    const restaurantName = rest?.name || data?.restaurantName || items[0].restaurantName || 'GreenBowl Healthy Bar';

    // CÁLCULOS ESTRICTOS EN EL BACKEND (se ignoran data.subtotal, data.total y data.deliveryFee)
    const subtotal = Math.round(items.reduce((sum: number, it: any) => sum + it.lineTotal, 0) * 100) / 100;
    const deliveryFee = rest?.deliveryFee !== undefined ? Number(rest.deliveryFee) : 4.5;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    const orderId = `HE-${Date.now().toString().slice(-6)}`;

    const deliveryAddressStr = typeof data?.deliveryAddress === 'string'
      ? data.deliveryAddress
      : data?.direccionEntrega || data?.deliveryAddress?.street || 'Av. Principal 123';

    const order: Order = {
      id: orderId,
      userId,
      restaurantId,
      restaurantName,
      items,
      subtotal,
      deliveryFee,
      total,
      donationPercentage: 3,
      totalNutrition: {
        calories: Math.round(items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo?.calories || 0) * it.quantity, 0)),
        proteinGrams: Math.round(items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo?.proteinGrams || 0) * it.quantity, 0) * 10) / 10,
        carbsGrams: Math.round(items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo?.carbsGrams || 0) * it.quantity, 0) * 10) / 10,
        fatGrams: Math.round(items.reduce((sum: number, it: any) => sum + (it.nutritionalInfo?.fatGrams || 0) * it.quantity, 0) * 10) / 10,
      },
      deliveryAddress: {
        street: deliveryAddressStr,
        city: 'Lima',
      },
      contactPhone: data?.contactPhone || data?.telefonoContacto || '+51987654321',
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

    // Donación automática vinculada (HE-HU5-005): 3 % calculado estrictamente en el backend
    const preferredFoundationId = data?.preferredFoundationId || data?.idFundacion;
    const donation = await this.donationsService.processAutomaticDonation(order, preferredFoundationId);
    order.donationId = donation.id;
    order.donationAmount = donation.donationAmount;
    order.donation = donation;

    this.db.orders.set(order.id, order);

    // Persistir en PostgreSQL
    await this.persistOrderToPrisma(order);

    // Crear notificación (HE-HU7-007)
    await this.notificationsService.createNotification(
      userId,
      `🎉 ¡Pedido #${order.id} confirmado!`,
      `Tu pedido en ${order.restaurantName} ha sido confirmado. Se donaron S/ ${donation.donationAmount.toFixed(2)} a ${donation.foundationName}.`,
      'ORDER_UPDATE',
      { orderId: order.id },
    );

    return order;
  }

  /**
   * HE-HU6-006: Historial de pedidos del usuario
   */
  async getOrderHistory(userId: string): Promise<Order[]> {
    // Si Prisma está conectado, consultar directamente la base de datos para máxima frescura
    try {
      if (this.prisma.connected) {
        const dbOrders = await this.prisma.order.findMany({
          where: { userId },
          include: {
            items: true,
            tracking: true,
            donation: { include: { foundation: true } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (dbOrders.length > 0) {
          const entities = dbOrders.map((dbo) => {
            const ent = this.mapDbOrderToEntity(dbo);
            this.db.orders.set(ent.id, ent);
            return ent;
          });
          return entities;
        }
      }
    } catch {
      // fallback a memoria
    }

    return Array.from(this.db.orders.values())
      .filter((o) => o.userId === userId)
      .map((o) => ({ ...o, donation: o.donation ?? (o.donationId ? this.db.donations.get(o.donationId) : undefined) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obtener detalle de pedido por ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<Order> {
    let order = this.db.orders.get(orderId);

    if (!order && this.prisma.connected) {
      try {
        const dbOrder = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            tracking: true,
            donation: { include: { foundation: true } },
            payment: true,
          },
        });
        if (dbOrder) {
          order = this.mapDbOrderToEntity(dbOrder);
          this.db.orders.set(order.id, order);
        }
      } catch {
        // fallback
      }
    }

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
    const order = await this.getOrderById(orderId);

    order.status = newStatus;
    order.tracking.currentStatus = newStatus;

    // Actualizar progreso y datos de conductor según estado
    switch (newStatus) {
      case OrderStatus.CONFIRMED:
        order.tracking.progressPercentage = 30;
        order.tracking.estimatedDeliveryTimeMinutes = 25;
        break;
      case OrderStatus.PREPARING:
        order.tracking.progressPercentage = 55;
        order.tracking.estimatedDeliveryTimeMinutes = 20;
        break;
      case OrderStatus.ON_THE_WAY:
        order.tracking.progressPercentage = 80;
        order.tracking.estimatedDeliveryTimeMinutes = 10;
        break;
      case OrderStatus.DELIVERED:
        order.tracking.progressPercentage = 100;
        order.tracking.estimatedDeliveryTimeMinutes = 0;
        break;
    }

    // Actualizar timeline
    const step = order.tracking.timeline.find((t) => t.status === newStatus);
    if (step) {
      step.completed = true;
      step.timestamp = new Date();
    }

    this.db.orders.set(orderId, order);

    // Persistir actualización en PostgreSQL
    if (this.prisma.connected) {
      try {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus },
        });
        await this.prisma.orderTracking.update({
          where: { orderId },
          data: {
            currentStatus: newStatus,
            progressPercentage: order.tracking.progressPercentage,
            estimatedDeliveryMinutes: order.tracking.estimatedDeliveryTimeMinutes,
            timeline: JSON.stringify(order.tracking.timeline),
          },
        });
      } catch {
        // resilient
      }
    }

    // Notificación en vivo
    await this.notificationsService.createNotification(
      order.userId,
      `🛵 Actualización de tu pedido #${orderId}`,
      `El estado ha cambiado a: ${newStatus}`,
      'ORDER_UPDATE',
      { orderId, status: newStatus },
    );

    return order;
  }
}
