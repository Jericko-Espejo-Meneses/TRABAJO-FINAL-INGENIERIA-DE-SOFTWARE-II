import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  /**
   * HE-HU4-004: Obtener el carrito activo del usuario con resumen nutricional y financiero
   */
  async getCart(userId: string): Promise<Cart> {
    if (this.prisma && this.prisma.connected) {
      try {
        const dbCart = await this.prisma.cart.findUnique({
          where: { userId },
          include: {
            items: true,
          },
        });

        if (dbCart) {
          const cart = this.mapDbCartToEntity(dbCart);
          this.db.carts.set(userId, cart);
          return cart;
        }
      } catch {
        // Fall back to memory
      }
    }

    let cart = this.db.carts.get(userId);
    if (!cart) {
      cart = this.createEmptyCart(userId);
      this.db.carts.set(userId, cart);
    }
    return cart;
  }

  /**
   * HE-HU4-004: Agregar producto al carrito
   */
  async addItem(userId: string, dto: AddCartItemDto): Promise<Cart> {
    const menuItem = this.db.menuItems.get(dto.menuItemId);
    if (!menuItem) {
      throw new NotFoundException(`El producto con ID "${dto.menuItemId}" no existe`);
    }

    if (!menuItem.isAvailable) {
      throw new BadRequestException(`El producto "${menuItem.name}" no está disponible en este momento`);
    }

    let cart = await this.getCart(userId);

    // Si el carrito ya contiene ítems de otro restaurante, se limpia para el nuevo restaurante
    if (cart.restaurantId && cart.restaurantId !== menuItem.restaurantId && cart.items.length > 0) {
      cart.items = [];
    }

    cart.restaurantId = menuItem.restaurantId;
    cart.restaurantName = menuItem.restaurantName;

    // Verificar si el ítem ya está en el carrito
    const existingIndex = cart.items.findIndex((item) => item.menuItemId === dto.menuItemId);

    if (existingIndex > -1) {
      // Incrementar cantidad
      cart.items[existingIndex].quantity += dto.quantity;
      cart.items[existingIndex].lineTotal =
        cart.items[existingIndex].quantity * cart.items[existingIndex].price;
      if (dto.specialInstructions) {
        cart.items[existingIndex].specialInstructions = dto.specialInstructions;
      }
    } else {
      // Añadir nuevo ítem
      const newItem: CartItem = {
        id: uuidv4(),
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: dto.quantity,
        imageUrl: menuItem.imageUrl,
        restaurantId: menuItem.restaurantId,
        restaurantName: menuItem.restaurantName,
        specialInstructions: dto.specialInstructions,
        nutritionalInfo: { ...menuItem.nutritionalInfo },
        lineTotal: menuItem.price * dto.quantity,
      };
      cart.items.push(newItem);
    }

    this.recalculateCart(cart);
    this.db.carts.set(userId, cart);

    // Persistir en PostgreSQL vía Prisma
    if (this.prisma && this.prisma.connected) {
      try {
        await this.ensureUserExists(userId);
        if (cart.restaurantId) {
          await this.ensureRestaurantExists(cart.restaurantId);
        }
        await this.ensureMenuItemExists(menuItem.id);

        const dbCart = await this.prisma.cart.upsert({
          where: { userId },
          create: {
            userId,
            restaurantId: cart.restaurantId,
          },
          update: {
            restaurantId: cart.restaurantId,
          },
        });

        // Eliminar del DB los ítems que ya no están en el carrito (e.g. si se limpió por cambio de restaurante)
        const currentItemIds = cart.items.map((it) => it.id);
        await this.prisma.cartItem.deleteMany({
          where: {
            cartId: dbCart.id,
            id: { notIn: currentItemIds },
          },
        });

        // Crear o actualizar los ítems del carrito en PostgreSQL
        for (const item of cart.items) {
          await this.ensureMenuItemExists(item.menuItemId);
          await this.prisma.cartItem.upsert({
            where: { id: item.id },
            create: {
              id: item.id,
              cartId: dbCart.id,
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              calories: item.nutritionalInfo?.calories || 0,
              proteinGrams: item.nutritionalInfo?.proteinGrams || 0,
              carbsGrams: item.nutritionalInfo?.carbsGrams || 0,
              fatGrams: item.nutritionalInfo?.fatGrams || 0,
            },
            update: {
              quantity: item.quantity,
              price: item.price,
            },
          });
        }
      } catch {
        // Resiliente ante fallas de DB
      }
    }

    return cart;
  }

  /**
   * HE-HU4-004: Actualizar cantidad o instrucciones de un ítem en el carrito
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException(`El ítem con ID "${itemId}" no se encuentra en el carrito`);
    }

    if (dto.quantity !== undefined) {
      if (dto.quantity === 0) {
        // Eliminar ítem si la cantidad es 0
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = dto.quantity;
        cart.items[itemIndex].lineTotal =
          dto.quantity * cart.items[itemIndex].price;
      }
    }

    if (dto.specialInstructions !== undefined && cart.items[itemIndex]) {
      cart.items[itemIndex].specialInstructions = dto.specialInstructions;
    }

    if (cart.items.length === 0) {
      cart.restaurantId = null;
      cart.restaurantName = null;
    }

    this.recalculateCart(cart);
    this.db.carts.set(userId, cart);

    // Persistir en PostgreSQL vía Prisma
    if (this.prisma && this.prisma.connected) {
      try {
        if (dto.quantity === 0) {
          await this.prisma.cartItem.delete({
            where: { id: itemId },
          }).catch(() => {});
        } else if (dto.quantity !== undefined) {
          await this.prisma.cartItem.update({
            where: { id: itemId },
            data: {
              quantity: dto.quantity,
            },
          }).catch(() => {});
        }

        if (cart.items.length === 0) {
          await this.prisma.cart.update({
            where: { userId },
            data: { restaurantId: null },
          }).catch(() => {});
        }
      } catch {
        // Resiliente ante fallas de DB
      }
    }

    return cart;
  }

  /**
   * HE-HU4-004: Eliminar un producto del carrito
   */
  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.id !== itemId);

    if (cart.items.length === initialLength) {
      throw new NotFoundException(`El ítem con ID "${itemId}" no se encuentra en el carrito`);
    }

    if (cart.items.length === 0) {
      cart.restaurantId = null;
      cart.restaurantName = null;
    }

    this.recalculateCart(cart);
    this.db.carts.set(userId, cart);

    // Persistir en PostgreSQL vía Prisma
    if (this.prisma && this.prisma.connected) {
      try {
        await this.prisma.cartItem.delete({
          where: { id: itemId },
        }).catch(() => {});

        if (cart.items.length === 0) {
          await this.prisma.cart.update({
            where: { userId },
            data: { restaurantId: null },
          }).catch(() => {});
        }
      } catch {
        // Resiliente ante fallas de DB
      }
    }

    return cart;
  }

  /**
   * HE-HU4-004: Vaciar completamente el carrito
   */
  async clearCart(userId: string): Promise<Cart> {
    const emptyCart = this.createEmptyCart(userId);
    this.db.carts.set(userId, emptyCart);

    // Persistir en PostgreSQL vía Prisma
    if (this.prisma && this.prisma.connected) {
      try {
        const dbCart = await this.prisma.cart.findUnique({
          where: { userId },
        });
        if (dbCart) {
          await this.prisma.cartItem.deleteMany({
            where: { cartId: dbCart.id },
          });
          await this.prisma.cart.update({
            where: { id: dbCart.id },
            data: { restaurantId: null },
          });
        }
      } catch {
        // Resiliente ante fallas de DB
      }
    }

    return emptyCart;
  }

  private createEmptyCart(userId: string): Cart {
    return {
      userId,
      restaurantId: null,
      restaurantName: null,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      totalNutrition: {
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fiberGrams: 0,
      },
      updatedAt: new Date(),
    };
  }

  private recalculateCart(cart: Cart) {
    let subtotal = 0;
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;

    for (const item of cart.items) {
      subtotal += item.lineTotal;
      calories += (item.nutritionalInfo.calories || 0) * item.quantity;
      protein += (item.nutritionalInfo.proteinGrams || 0) * item.quantity;
      carbs += (item.nutritionalInfo.carbsGrams || 0) * item.quantity;
      fat += (item.nutritionalInfo.fatGrams || 0) * item.quantity;
      fiber += (item.nutritionalInfo.fiberGrams || 0) * item.quantity;
    }

    // Costo de delivery del restaurante asociado
    let deliveryFee = 0;
    if (cart.restaurantId && cart.items.length > 0) {
      const rest = this.db.restaurants.get(cart.restaurantId);
      deliveryFee = rest ? rest.deliveryFee : 4.0;
    }

    cart.subtotal = Math.round(subtotal * 100) / 100;
    cart.deliveryFee = deliveryFee;
    cart.total = Math.round((cart.subtotal + deliveryFee) * 100) / 100;
    cart.totalNutrition = {
      calories: Math.round(calories),
      proteinGrams: Math.round(protein * 10) / 10,
      carbsGrams: Math.round(carbs * 10) / 10,
      fatGrams: Math.round(fat * 10) / 10,
      fiberGrams: Math.round(fiber * 10) / 10,
    };
    cart.updatedAt = new Date();
  }

  private mapDbCartToEntity(dbCart: any): Cart {
    const memCart = this.db.carts.get(dbCart.userId);
    const restaurant = dbCart.restaurantId
      ? this.db.restaurants.get(dbCart.restaurantId)
      : null;

    const items: CartItem[] = (dbCart.items || []).map((it: any) => {
      const menuItem = this.db.menuItems.get(it.menuItemId);
      const memItem = memCart?.items?.find((m) => m.id === it.id || m.menuItemId === it.menuItemId);
      const price = typeof it.price === 'number' ? it.price : (menuItem?.price || 0);
      const quantity = typeof it.quantity === 'number' ? it.quantity : 1;

      return {
        id: it.id,
        menuItemId: it.menuItemId,
        name: it.name || menuItem?.name || 'Producto',
        price,
        quantity,
        imageUrl:
          menuItem?.imageUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        restaurantId: menuItem?.restaurantId || dbCart.restaurantId || '',
        restaurantName: menuItem?.restaurantName || restaurant?.name || '',
        specialInstructions: memItem?.specialInstructions,
        nutritionalInfo: {
          calories: it.calories ?? menuItem?.nutritionalInfo?.calories ?? 0,
          proteinGrams: it.proteinGrams ?? menuItem?.nutritionalInfo?.proteinGrams ?? 0,
          carbsGrams: it.carbsGrams ?? menuItem?.nutritionalInfo?.carbsGrams ?? 0,
          fatGrams: it.fatGrams ?? menuItem?.nutritionalInfo?.fatGrams ?? 0,
          fiberGrams: menuItem?.nutritionalInfo?.fiberGrams ?? 0,
        },
        lineTotal: price * quantity,
      };
    });

    const cart: Cart = {
      userId: dbCart.userId,
      restaurantId: dbCart.restaurantId || null,
      restaurantName: restaurant?.name || null,
      items,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      totalNutrition: {
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fiberGrams: 0,
      },
      updatedAt: dbCart.updatedAt ? new Date(dbCart.updatedAt) : new Date(),
    };

    this.recalculateCart(cart);
    return cart;
  }

  private async ensureUserExists(userId: string): Promise<void> {
    try {
      const userExists = await this.prisma?.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        const memUser = this.db.users.get(userId);
        await this.prisma?.user.create({
          data: {
            id: userId,
            email: memUser?.email || `${userId}@healthexpress.com`,
            fullName: memUser?.fullName || 'Usuario HealthExpress',
            passwordHash: memUser?.passwordHash || null,
            phone: memUser?.phone || '+51987654321',
            provider: memUser?.provider || 'email',
            dietaryPreferences: JSON.stringify(memUser?.dietaryPreferences || []),
            healthGoals: JSON.stringify(memUser?.healthGoals || []),
          },
        }).catch(() => {});
      }
    } catch {
      // resilient
    }
  }

  private async ensureRestaurantExists(restaurantId: string): Promise<void> {
    try {
      const restExists = await this.prisma?.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restExists) {
        const memRest = this.db.restaurants.get(restaurantId);
        if (memRest) {
          await this.prisma?.restaurant.create({
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
    } catch {
      // resilient
    }
  }

  private async ensureMenuItemExists(menuItemId: string): Promise<void> {
    try {
      const itemExists = await this.prisma?.menuItem.findUnique({ where: { id: menuItemId } });
      if (!itemExists) {
        const memItem = this.db.menuItems.get(menuItemId);
        if (memItem) {
          if (memItem.restaurantId) {
            await this.ensureRestaurantExists(memItem.restaurantId);
          }
          await this.prisma?.menuItem.create({
            data: {
              id: memItem.id,
              restaurantId: memItem.restaurantId,
              name: memItem.name,
              description: memItem.description,
              price: memItem.price,
              imageUrl: memItem.imageUrl,
              category: memItem.category,
              dietaryTags: JSON.stringify(memItem.dietaryTags || []),
              allergens: JSON.stringify(memItem.allergens || []),
              ingredients: JSON.stringify(memItem.ingredients || []),
              nutriScore: memItem.nutritionalInfo?.nutriScore || (memItem as any).nutriScore || 'A',
              glycemicIndex: memItem.nutritionalInfo?.glycemicIndex || (memItem as any).glycemicIndex || 'Bajo',
            },
          }).catch(() => {});
        }
      }
    } catch {
      // resilient
    }
  }
}
