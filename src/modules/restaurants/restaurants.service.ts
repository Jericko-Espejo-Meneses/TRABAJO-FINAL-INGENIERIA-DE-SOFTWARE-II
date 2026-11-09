import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Restaurant } from './entities/restaurant.entity';
import { SearchRestaurantsDto } from './dto/search-restaurants.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  /**
   * Mapea un restaurante desde PostgreSQL al formato de la entidad en memoria
   */
  private mapDbRestaurantToEntity(dbr: any): Restaurant {
    let dietaryTags: string[] = [];
    if (dbr.dietaryTags) {
      try {
        dietaryTags = typeof dbr.dietaryTags === 'string' ? JSON.parse(dbr.dietaryTags) : dbr.dietaryTags;
      } catch {
        dietaryTags = [];
      }
    }

    const mapPriceLevel = (level: any): '$' | '$$' | '$$$' => {
      if (level === 1 || level === '$') return '$';
      if (level === 3 || level === '$$$') return '$$$';
      return '$$';
    };

    return {
      id: dbr.id,
      name: dbr.name,
      description: dbr.description,
      logoUrl: dbr.logoUrl,
      bannerUrl: dbr.bannerUrl,
      rating: dbr.rating,
      reviewsCount: dbr.totalReviews ?? 0,
      deliveryTimeMinutes: dbr.deliveryTimeMinutes,
      deliveryFee: dbr.deliveryFee,
      priceLevel: mapPriceLevel(dbr.priceLevel),
      category: dbr.foodType || 'Saludable',
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
      address: dbr.address,
      latitude: dbr.latitude,
      longitude: dbr.longitude,
      phone: dbr.phone,
      isHealthyCertified: dbr.isHealthyCertified ?? (dbr.isActive ?? true),
      isOpen: dbr.isOpen ?? (dbr.isActive ?? true),
      createdAt: dbr.createdAt ? new Date(dbr.createdAt) : new Date(),
    };
  }

  /**
   * Mapea un plato de menú de PostgreSQL al formato de la entidad en memoria
   */
  private mapDbMenuItemToEntity(dbm: any, restaurantName = ''): any {
    let dietaryTags: string[] = [];
    let allergens: string[] = [];
    let ingredients: string[] = [];

    if (dbm.dietaryTags) {
      try {
        dietaryTags = typeof dbm.dietaryTags === 'string' ? JSON.parse(dbm.dietaryTags) : dbm.dietaryTags;
      } catch {
        dietaryTags = [];
      }
    }

    if (dbm.allergens) {
      try {
        allergens = typeof dbm.allergens === 'string' ? JSON.parse(dbm.allergens) : dbm.allergens;
      } catch {
        allergens = [];
      }
    }

    if (dbm.ingredients) {
      try {
        ingredients = typeof dbm.ingredients === 'string' ? JSON.parse(dbm.ingredients) : dbm.ingredients;
      } catch {
        ingredients = [];
      }
    }

    return {
      id: dbm.id,
      restaurantId: dbm.restaurantId,
      restaurantName: restaurantName || '',
      name: dbm.name,
      description: dbm.description,
      detailedDescription: dbm.description,
      price: dbm.price,
      imageUrl: dbm.imageUrl,
      category: dbm.category,
      portionSizeGrams: 350,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      allergens: Array.isArray(allergens) ? allergens : [],
      preparationMethod: 'Cocinado al vapor y grill sin conservantes.',
      dietaryCertifications: [],
      nutritionalInfo: {
        calories: dbm.nutritionalInfo?.calories ?? 0,
        proteinGrams: dbm.nutritionalInfo?.proteinGrams ?? 0,
        carbsGrams: dbm.nutritionalInfo?.carbsGrams ?? 0,
        fatGrams: dbm.nutritionalInfo?.fatGrams ?? 0,
        fiberGrams: dbm.nutritionalInfo?.fiberGrams ?? 0,
        saturatedFatGrams: 0,
        sugarGrams: 0,
        sodiumMg: dbm.nutritionalInfo?.sodiumMg ?? 0,
        glycemicIndex: dbm.glycemicIndex || 'Bajo',
        nutriScore: dbm.nutriScore || 'A',
      },
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
      healthGoals: [],
      isPopular: true,
      isAvailable: dbm.isAvailable ?? true,
      rating: 4.8,
      createdAt: dbm.createdAt ? new Date(dbm.createdAt) : new Date(),
    };
  }

  /**
   * HE-HU2-002: Búsqueda y filtrado de restaurantes con opciones saludables
   */
  async search(dto: SearchRestaurantsDto): Promise<Restaurant[]> {
    let results: Restaurant[] = [];
    let loadedFromDatabase = false;

    // 1. Intentar consultar PostgreSQL si Prisma está conectado
    if (this.prisma?.connected) {
      try {
        const dbRestaurants = await this.prisma.restaurant.findMany();
        if (dbRestaurants) {
          loadedFromDatabase = true;
          results = dbRestaurants.map((r) => {
            const entity = this.mapDbRestaurantToEntity(r);
            this.db.restaurants.set(entity.id, entity);
            return entity;
          });
        }
      } catch {
        // Fallback resiliente a memoria en caso de error
        results = [];
      }
    }

    // 2. Si no hay conexión o no hubo resultados, usar almacén en memoria
    if (!loadedFromDatabase) {
      results = Array.from(this.db.restaurants.values());
    }

    const searchQuery = dto.query || dto.q;
    const categoryQuery = dto.category || dto.tipoComida;
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const canonicalTag = (value: string) => {
      const tag = normalize(value).replace(/[-_\s]+/g, ' ');
      const aliases: Record<string, string> = {
        vegan: 'vegano', 'low calorie': 'bajo en calorias',
        'high protein': 'alto en proteina', 'low fat': 'bajo en grasa',
      };
      return aliases[tag] ?? tag;
    };
    const tags = [...new Set([dto.dietaryTag, ...[dto.tags].flat()]
      .filter((tag): tag is string => typeof tag === 'string')
      .flatMap((tag) => tag.split(','))
      .map(canonicalTag).filter(Boolean))];
    const hasCoords = dto.lat !== undefined && dto.lng !== undefined;
    if ((dto.lat !== undefined || dto.lng !== undefined) && !hasCoords) {
      throw new BadRequestException('Debes enviar lat y lng juntos.');
    }
    if ((dto.distanciaMax !== undefined || tags.includes('nearby')) && !hasCoords) {
      throw new BadRequestException('La distancia máxima y Cerca de mí requieren lat y lng.');
    }
    // Distancia geográfica en km (Haversine). Nunca reutilizar distancias de otra búsqueda.
    results = results.map((restaurant) => {
      let distanceKm: number | null = null;
      const { latitude, longitude } = restaurant;
      if (hasCoords && Number.isFinite(latitude) && Number.isFinite(longitude)
        && Math.abs(latitude!) <= 90 && Math.abs(longitude!) <= 180) {
        const rad = (degrees: number) => degrees * Math.PI / 180;
        const a = Math.sin(rad(latitude! - dto.lat!) / 2) ** 2
          + Math.cos(rad(dto.lat!)) * Math.cos(rad(latitude!))
          * Math.sin(rad(longitude! - dto.lng!) / 2) ** 2;
        distanceKm = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
      }
      return { ...restaurant, distanceKm };
    });
    const maxDistance = tags.includes('nearby') ? Math.min(dto.distanciaMax ?? Infinity, 2) : dto.distanciaMax;
    if (maxDistance !== undefined) {
      results = results.filter((r) => r.distanceKm != null && r.distanceKm <= maxDistance);
    }

    // 1. Filtrar por término de búsqueda (nombre, descripción, categoría)
    if (searchQuery) {
      const q = normalize(searchQuery);
      results = results.filter(
        (r) =>
          normalize(r.name).includes(q) ||
          normalize(r.description).includes(q) ||
          normalize(r.category).includes(q) ||
          r.dietaryTags.some((tag) => normalize(tag).includes(q)),
      );
    }

    // 2. Filtrar por categoría
    if (categoryQuery) {
      const cat = normalize(categoryQuery);
      results = results.filter((r) => normalize(r.category).includes(cat));
    }

    // 3. Filtrar por etiqueta dietética saludable (vegano, keto, sin gluten, etc.)
    if (tags.length) {
      results = results.filter((r) => tags.every((tag) => {
        if (tag === 'nearby') return true; // Ya aplicado con el límite más restrictivo.
        if (tag === 'cheap') return r.priceLevel === '$';
        return r.dietaryTags.some((t) => canonicalTag(t) === tag);
      }));
    }

    // 4. Filtrar por calificación mínima
    if (dto.minRating !== undefined) {
      results = results.filter((r) => r.rating >= dto.minRating);
    }

    // 5. Filtrar por tiempo máximo de entrega
    if (dto.maxDeliveryTime !== undefined) {
      results = results.filter((r) => r.deliveryTimeMinutes <= dto.maxDeliveryTime);
    }

    // 6. Filtrar por certificación saludable
    if (dto.isHealthyCertified !== undefined) {
      results = results.filter((r) => r.isHealthyCertified === dto.isHealthyCertified);
    }

    // 7. Ordenación
    if (dto.sortBy === 'deliveryTime') {
      results.sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes);
    } else if (dto.sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: ordenar por calificación descendente
      results.sort((a, b) => b.rating - a.rating);
    }

    // Redondear solo para mostrar; el límite se aplica a la distancia exacta.
    return results.map((r) => ({ ...r, distanceKm: r.distanceKm == null ? null : Math.round(r.distanceKm * 100) / 100 }));
  }

  async findAll(queryDto: SearchRestaurantsDto = {}): Promise<Restaurant[]> {
    return this.search(queryDto);
  }

  async findById(id: string): Promise<Restaurant & { menu: any[] }> {
    let restaurant = this.db.restaurants.get(id);
    let menu: any[] = [];

    if (restaurant) {
      menu = Array.from(this.db.menuItems.values()).filter(
        (item) => item.restaurantId === id,
      );
    }

    // Si no está en memoria y Prisma está conectado, buscar en PostgreSQL con menú incluido
    if (!restaurant && this.prisma?.connected) {
      try {
        const dbRestaurant = await this.prisma.restaurant.findUnique({
          where: { id },
          include: {
            menuItems: {
              include: {
                nutritionalInfo: true,
              },
            },
          },
        });

        if (dbRestaurant) {
          restaurant = this.mapDbRestaurantToEntity(dbRestaurant);
          this.db.restaurants.set(restaurant.id, restaurant);

          menu = (dbRestaurant.menuItems || []).map((it) =>
            this.mapDbMenuItemToEntity(it, restaurant!.name),
          );
          menu.forEach((item) => this.db.menuItems.set(item.id, item));
        }
      } catch {
        // Fallback resiliente
      }
    }

    if (!restaurant) {
      throw new NotFoundException(`Restaurante con ID "${id}" no encontrado`);
    }

    // Si el restaurante estaba en memoria pero su menú está vacío y Prisma está conectado, buscar items en Prisma
    if (menu.length === 0 && this.prisma?.connected) {
      try {
        const dbItems = await this.prisma.menuItem.findMany({
          where: { restaurantId: id },
          include: { nutritionalInfo: true },
        });
        if (dbItems && dbItems.length > 0) {
          menu = dbItems.map((it) => this.mapDbMenuItemToEntity(it, restaurant!.name));
          menu.forEach((item) => this.db.menuItems.set(item.id, item));
        }
      } catch {
        // Fallback resiliente
      }
    }

    return {
      ...restaurant,
      menu,
    };
  }

  async getCategories(): Promise<{ categories: string[]; dietaryTags: string[] }> {
    if (this.prisma?.connected) {
      try {
        const dbRestaurants = await this.prisma.restaurant.findMany({
          select: {
            foodType: true,
            dietaryTags: true,
          },
        });

        if (dbRestaurants && dbRestaurants.length > 0) {
          const categoriesSet = new Set<string>();
          const tagsSet = new Set<string>();

          dbRestaurants.forEach((r) => {
            if (r.foodType) {
              categoriesSet.add(r.foodType);
            }
            if (r.dietaryTags) {
              try {
                const parsed = typeof r.dietaryTags === 'string' ? JSON.parse(r.dietaryTags) : r.dietaryTags;
                if (Array.isArray(parsed)) {
                  parsed.forEach((t: string) => tagsSet.add(t));
                }
              } catch {
                // ignorar errores de parseo
              }
            }
          });

          return {
            categories: Array.from(categoriesSet),
            dietaryTags: Array.from(tagsSet),
          };
        }
      } catch {
        // Fallback a memoria
      }
    }

    const all = Array.from(this.db.restaurants.values());
    const categoriesSet = new Set<string>();
    const tagsSet = new Set<string>();

    all.forEach((r) => {
      categoriesSet.add(r.category);
      r.dietaryTags.forEach((t) => tagsSet.add(t));
    });

    return {
      categories: Array.from(categoriesSet),
      dietaryTags: Array.from(tagsSet),
    };
  }
}
