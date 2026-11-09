import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { MenuItem } from '../../menus/entities/menu-item.entity';

export type FavoriteType = 'RESTAURANT' | 'MENU_ITEM';

export class Favorite {
  id: string;
  userId: string;
  type: FavoriteType;
  targetId: string;
  restaurant?: Restaurant;
  menuItem?: MenuItem;
  createdAt: Date;
}
