import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Favorite, FavoriteType } from './entities/favorite.entity';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MenuItem } from '../menus/entities/menu-item.entity';
import { v4 as uuidv4 } from 'uuid';

export interface UserFavoritesResponse {
  favoriteRestaurants: Restaurant[];
  favoriteMenuItems: MenuItem[];
  totalCount: number;
}

@Injectable()
export class FavoritesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * HE-HU12-012: Listar todos los favoritos (restaurantes y menús) del usuario
   */
  async getUserFavorites(userId: string): Promise<UserFavoritesResponse> {
    const userFavs = Array.from(this.db.favorites.values()).filter(
      (f) => f.userId === userId,
    );

    const favoriteRestaurants: Restaurant[] = [];
    const favoriteMenuItems: MenuItem[] = [];

    for (const fav of userFavs) {
      if (fav.type === 'RESTAURANT') {
        const rest = this.db.restaurants.get(fav.targetId);
        if (rest) favoriteRestaurants.push(rest);
      } else if (fav.type === 'MENU_ITEM') {
        const item = this.db.menuItems.get(fav.targetId);
        if (item) favoriteMenuItems.push(item);
      }
    }

    return {
      favoriteRestaurants,
      favoriteMenuItems,
      totalCount: favoriteRestaurants.length + favoriteMenuItems.length,
    };
  }

  /**
   * HE-HU12-012: Alternar favorito (Toggle: si existe lo quita, si no existe lo agrega)
   */
  async toggleFavorite(userId: string, dto: ToggleFavoriteDto): Promise<{ isFavorite: boolean; message: string }> {
    const existing = this.findUserFavorite(userId, dto.type, dto.targetId);

    if (existing) {
      this.db.favorites.delete(existing.id);
      return {
        isFavorite: false,
        message: `${dto.type === 'RESTAURANT' ? 'Restaurante' : 'Plato'} eliminado de tus favoritos`,
      };
    } else {
      await this.addFavorite(userId, dto.type, dto.targetId);
      return {
        isFavorite: true,
        message: `${dto.type === 'RESTAURANT' ? 'Restaurante' : 'Plato'} agregado a tus favoritos con éxito`,
      };
    }
  }

  /**
   * HE-HU12-012: Agregar restaurante o plato a favoritos
   */
  async addFavorite(userId: string, type: FavoriteType, targetId: string): Promise<Favorite> {
    // Validar existencia del destino
    let rest: Restaurant | undefined;
    let menu: MenuItem | undefined;

    if (type === 'RESTAURANT') {
      rest = this.db.restaurants.get(targetId);
      if (!rest) {
        throw new NotFoundException(`Restaurante con ID "${targetId}" no encontrado`);
      }
    } else {
      menu = this.db.menuItems.get(targetId);
      if (!menu) {
        throw new NotFoundException(`Plato del menú con ID "${targetId}" no encontrado`);
      }
    }

    const existing = this.findUserFavorite(userId, type, targetId);
    if (existing) {
      return existing; // Ya está en favoritos
    }

    const favorite: Favorite = {
      id: `fav-${uuidv4().substring(0, 8)}`,
      userId,
      type,
      targetId,
      restaurant: rest,
      menuItem: menu,
      createdAt: new Date(),
    };

    this.db.favorites.set(favorite.id, favorite);
    return favorite;
  }

  /**
   * HE-HU12-012: Remover de favoritos
   */
  async removeFavorite(userId: string, type: FavoriteType, targetId: string): Promise<{ success: boolean }> {
    const existing = this.findUserFavorite(userId, type, targetId);
    if (!existing) {
      throw new NotFoundException(`El elemento no se encuentra en tu lista de favoritos`);
    }

    this.db.favorites.delete(existing.id);
    return { success: true };
  }

  /**
   * Verificar si un elemento específico es favorito del usuario
   */
  async isFavorite(userId: string, type: FavoriteType, targetId: string): Promise<{ isFavorite: boolean }> {
    const existing = this.findUserFavorite(userId, type, targetId);
    return { isFavorite: !!existing };
  }

  private findUserFavorite(userId: string, type: FavoriteType, targetId: string): Favorite | undefined {
    return Array.from(this.db.favorites.values()).find(
      (f) => f.userId === userId && f.type === type && f.targetId === targetId,
    );
  }
}
