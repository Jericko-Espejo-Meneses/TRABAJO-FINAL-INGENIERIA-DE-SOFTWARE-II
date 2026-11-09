import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Favorite, FavoriteType } from './entities/favorite.entity';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MenuItem, NutritionalInfo } from '../menus/entities/menu-item.entity';
import { v4 as uuidv4 } from 'uuid';

export interface UserFavoritesResponse {
  favoriteRestaurants: Restaurant[];
  favoriteMenuItems: MenuItem[];
  totalCount: number;
}

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * HE-HU12-012: Listar todos los favoritos (restaurantes y menús) del usuario
   */
  async getUserFavorites(userId: string): Promise<UserFavoritesResponse> {
    if (this.prisma.connected) {
      try {
        const rows = await this.prisma.favorite.findMany({
          where: { userId },
          include: {
            restaurant: true,
            menuItem: {
              include: {
                nutritionalInfo: true,
                restaurant: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (
          rows.length > 0 ||
          !Array.from(this.db.favorites.values()).some((f) => f.userId === userId)
        ) {
          const favoriteRestaurants: Restaurant[] = [];
          const favoriteMenuItems: MenuItem[] = [];

          for (const row of rows) {
            if (row.restaurantId) {
              const rest =
                this.db.restaurants.get(row.restaurantId) ||
                (row.restaurant
                  ? this.mapDbRestaurantToEntity(row.restaurant)
                  : undefined);
              if (rest) {
                favoriteRestaurants.push(rest);
              }
            } else if (row.menuItemId) {
              const item =
                this.db.menuItems.get(row.menuItemId) ||
                (row.menuItem
                  ? this.mapDbMenuItemToEntity(row.menuItem)
                  : undefined);
              if (item) {
                favoriteMenuItems.push(item);
              }
            }
          }

          return {
            favoriteRestaurants,
            favoriteMenuItems,
            totalCount: favoriteRestaurants.length + favoriteMenuItems.length,
          };
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al consultar favoritos en Prisma: ${error?.message}`,
        );
      }
    }

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
  async toggleFavorite(
    userId: string,
    dto: ToggleFavoriteDto,
  ): Promise<{ isFavorite: boolean; message: string }> {
    let existing = false;

    if (this.prisma.connected) {
      try {
        const fav = await this.prisma.favorite.findFirst({
          where: {
            userId,
            ...(dto.type === 'RESTAURANT'
              ? { restaurantId: dto.targetId }
              : { menuItemId: dto.targetId }),
          },
          select: { id: true },
        });
        existing = !!fav;
      } catch (error: any) {
        this.logger.warn(
          `Error al verificar existencia de favorito en Prisma: ${error?.message}`,
        );
        existing = !!this.findUserFavorite(userId, dto.type, dto.targetId);
      }
    } else {
      existing = !!this.findUserFavorite(userId, dto.type, dto.targetId);
    }

    if (!existing && this.findUserFavorite(userId, dto.type, dto.targetId)) {
      existing = true;
    }

    if (existing) {
      await this.removeFavorite(userId, dto.type, dto.targetId);
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
  async addFavorite(
    userId: string,
    type: FavoriteType,
    targetId: string,
  ): Promise<Favorite> {
    // Validar existencia del destino
    let rest: Restaurant | undefined;
    let menu: MenuItem | undefined;

    if (type === 'RESTAURANT') {
      rest = this.db.restaurants.get(targetId);
      if (!rest && this.prisma.connected) {
        try {
          const dbRest = await this.prisma.restaurant.findUnique({
            where: { id: targetId },
          });
          if (dbRest) {
            rest = this.mapDbRestaurantToEntity(dbRest);
            this.db.restaurants.set(rest.id, rest);
          }
        } catch (error: any) {
          this.logger.warn(
            `Error al buscar restaurante en Prisma: ${error?.message}`,
          );
        }
      }
      if (!rest) {
        throw new NotFoundException(
          `Restaurante con ID "${targetId}" no encontrado`,
        );
      }
    } else {
      menu = this.db.menuItems.get(targetId);
      if (!menu && this.prisma.connected) {
        try {
          const dbMenu = await this.prisma.menuItem.findUnique({
            where: { id: targetId },
            include: { nutritionalInfo: true, restaurant: true },
          });
          if (dbMenu) {
            menu = this.mapDbMenuItemToEntity(dbMenu);
            this.db.menuItems.set(menu.id, menu);
          }
        } catch (error: any) {
          this.logger.warn(
            `Error al buscar plato en Prisma: ${error?.message}`,
          );
        }
      }
      if (!menu) {
        throw new NotFoundException(
          `Plato del menú con ID "${targetId}" no encontrado`,
        );
      }
    }

    const existing = this.findUserFavorite(userId, type, targetId);
    if (existing) {
      if (this.prisma.connected) {
        try {
          await this.prisma.favorite.upsert({
            where: { id: existing.id },
            update: {},
            create: {
              id: existing.id,
              userId,
              restaurantId: type === 'RESTAURANT' ? targetId : null,
              menuItemId: type === 'MENU_ITEM' ? targetId : null,
              createdAt: existing.createdAt,
            },
          });
        } catch (error: any) {
          this.logger.warn(
            `Error al sincronizar favorito existente en Prisma: ${error?.message}`,
          );
        }
      }
      return existing; // Ya está en favoritos
    }

    if (this.prisma.connected) {
      try {
        const existingDb = await this.prisma.favorite.findFirst({
          where: {
            userId,
            ...(type === 'RESTAURANT'
              ? { restaurantId: targetId }
              : { menuItemId: targetId }),
          },
        });
        if (existingDb) {
          const favEntity: Favorite = {
            id: existingDb.id,
            userId,
            type,
            targetId,
            restaurant: rest,
            menuItem: menu,
            createdAt: existingDb.createdAt,
          };
          this.db.favorites.set(favEntity.id, favEntity);
          return favEntity;
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al verificar favorito en Prisma: ${error?.message}`,
        );
      }
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

    if (this.prisma.connected) {
      try {
        await this.prisma.favorite.create({
          data: {
            id: favorite.id,
            userId,
            restaurantId: type === 'RESTAURANT' ? targetId : null,
            menuItemId: type === 'MENU_ITEM' ? targetId : null,
            createdAt: favorite.createdAt,
          },
        });
      } catch (error: any) {
        this.logger.warn(
          `Error al guardar favorito en Prisma: ${error?.message}`,
        );
      }
    }

    return favorite;
  }

  /**
   * HE-HU12-012: Remover de favoritos
   */
  async removeFavorite(
    userId: string,
    type: FavoriteType,
    targetId: string,
  ): Promise<{ success: boolean }> {
    const existingInMemory = this.findUserFavorite(userId, type, targetId);
    let deletedInPrisma = false;

    if (this.prisma.connected) {
      try {
        const deleteResult = await this.prisma.favorite.deleteMany({
          where: {
            userId,
            ...(type === 'RESTAURANT'
              ? { restaurantId: targetId }
              : { menuItemId: targetId }),
          },
        });
        if (deleteResult.count > 0) {
          deletedInPrisma = true;
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al eliminar favorito en Prisma: ${error?.message}`,
        );
      }
    }

    for (const [id, fav] of this.db.favorites.entries()) {
      if (
        fav.userId === userId &&
        fav.type === type &&
        fav.targetId === targetId
      ) {
        this.db.favorites.delete(id);
      }
    }

    if (!existingInMemory && !deletedInPrisma) {
      throw new NotFoundException(
        `El elemento no se encuentra en tu lista de favoritos`,
      );
    }

    return { success: true };
  }

  /**
   * Verificar si un elemento específico es favorito del usuario
   */
  async isFavorite(
    userId: string,
    type: FavoriteType,
    targetId: string,
  ): Promise<{ isFavorite: boolean }> {
    if (this.prisma.connected) {
      try {
        const found = await this.prisma.favorite.findFirst({
          where: {
            userId,
            ...(type === 'RESTAURANT'
              ? { restaurantId: targetId }
              : { menuItemId: targetId }),
          },
          select: { id: true },
        });
        if (found) {
          return { isFavorite: true };
        }
        if (!this.findUserFavorite(userId, type, targetId)) {
          return { isFavorite: false };
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al verificar favorito en Prisma: ${error?.message}`,
        );
      }
    }

    const existing = this.findUserFavorite(userId, type, targetId);
    return { isFavorite: !!existing };
  }

  private findUserFavorite(
    userId: string,
    type: FavoriteType,
    targetId: string,
  ): Favorite | undefined {
    return Array.from(this.db.favorites.values()).find(
      (f) => f.userId === userId && f.type === type && f.targetId === targetId,
    );
  }

  private mapDbRestaurantToEntity(r: any): Restaurant {
    let dietaryTags: string[] = [];
    try {
      dietaryTags =
        typeof r.dietaryTags === 'string'
          ? JSON.parse(r.dietaryTags)
          : r.dietaryTags || [];
    } catch {
      dietaryTags = [];
    }

    let priceLevel: '$' | '$$' | '$$$' = '$$';
    if (r.priceLevel === 1 || r.priceLevel === '$') priceLevel = '$';
    else if (r.priceLevel === 2 || r.priceLevel === '$$') priceLevel = '$$';
    else if (r.priceLevel === 3 || r.priceLevel === '$$$') priceLevel = '$$$';

    return {
      id: r.id,
      name: r.name,
      description: r.description,
      logoUrl: r.logoUrl,
      bannerUrl: r.bannerUrl,
      rating: r.rating ?? 4.8,
      reviewsCount: r.totalReviews ?? 0,
      deliveryTimeMinutes: r.deliveryTimeMinutes ?? 30,
      deliveryFee: r.deliveryFee ?? 4.5,
      priceLevel,
      category: r.foodType || 'Saludable',
      dietaryTags,
      address: r.address || '',
      phone: r.phone || '',
      isHealthyCertified: true,
      isOpen: r.isActive ?? true,
      createdAt: r.createdAt ?? new Date(),
    };
  }

  private mapDbMenuItemToEntity(m: any): MenuItem {
    let dietaryTags: string[] = [];
    let allergens: string[] = [];
    let ingredients: string[] = [];

    try {
      dietaryTags =
        typeof m.dietaryTags === 'string'
          ? JSON.parse(m.dietaryTags)
          : m.dietaryTags || [];
    } catch {
      dietaryTags = [];
    }
    try {
      allergens =
        typeof m.allergens === 'string'
          ? JSON.parse(m.allergens)
          : m.allergens || [];
    } catch {
      allergens = [];
    }
    try {
      ingredients =
        typeof m.ingredients === 'string'
          ? JSON.parse(m.ingredients)
          : m.ingredients || [];
    } catch {
      ingredients = [];
    }

    const nutInfo: NutritionalInfo = {
      calories: m.nutritionalInfo?.calories ?? 0,
      proteinGrams: m.nutritionalInfo?.proteinGrams ?? 0,
      carbsGrams: m.nutritionalInfo?.carbsGrams ?? 0,
      fatGrams: m.nutritionalInfo?.fatGrams ?? 0,
      fiberGrams: m.nutritionalInfo?.fiberGrams ?? 0,
      sodiumMg: m.nutritionalInfo?.sodiumMg ?? 0,
      glycemicIndex: (m.glycemicIndex as any) || 'Bajo',
      nutriScore: (m.nutriScore as any) || 'A',
    };

    return {
      id: m.id,
      restaurantId: m.restaurantId,
      restaurantName: m.restaurant?.name || '',
      name: m.name,
      description: m.description,
      price: m.price,
      imageUrl: m.imageUrl,
      category: m.category,
      ingredients,
      allergens,
      nutritionalInfo: nutInfo,
      dietaryTags,
      healthGoals: [],
      isPopular: true,
      isAvailable: m.isAvailable ?? true,
      rating: 4.8,
      createdAt: m.createdAt ?? new Date(),
    };
  }
}
