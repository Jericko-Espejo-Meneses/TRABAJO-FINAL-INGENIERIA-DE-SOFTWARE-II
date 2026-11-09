import { NutritionalInfo } from '../../menus/entities/menu-item.entity';

export class CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  restaurantId: string;
  restaurantName: string;
  specialInstructions?: string;
  nutritionalInfo: NutritionalInfo;
  lineTotal: number;
}
