import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * HE-HU4-004: Obtener el carrito activo del usuario con resumen nutricional y financiero
   */
  async getCart(userId: string): Promise<Cart> {
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
    return cart;
  }

  /**
   * HE-HU4-004: Vaciar completamente el carrito
   */
  async clearCart(userId: string): Promise<Cart> {
    const emptyCart = this.createEmptyCart(userId);
    this.db.carts.set(userId, emptyCart);
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
}
