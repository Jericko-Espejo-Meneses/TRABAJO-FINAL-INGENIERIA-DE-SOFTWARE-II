import { CartItem } from './cart-item.entity';
import { NutritionalInfo } from '../../menus/entities/menu-item.entity';

export class Cart {
  userId: string;
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalNutrition: NutritionalInfo;
  updatedAt: Date;
}
