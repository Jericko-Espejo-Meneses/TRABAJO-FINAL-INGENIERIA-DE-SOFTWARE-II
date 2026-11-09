import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MenuItem, NutritionalInfo } from './entities/menu-item.entity';

export interface NutritionalDetailResponse {
  menuItemId: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  price: number;
  imageUrl: string;
  category: string;
  portionSizeGrams: number;
  description: string;
  detailedDescription: string;
  preparationMethod: string;
  nutriScore: string;
  glycemicIndex: string;
  macronutrients: {
    caloriesKcal: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    saturatedFatGrams: number;
    sugarGrams: number;
    sodiumMg: number;
  };
  vitaminsAndMinerals: Record<string, string>;
  ingredients: string[];
  allergens: string[];
  dietaryCertifications: string[];
  dietaryTags: string[];
  healthGoals: string[];
}

@Injectable()
export class MenusService {
  private readonly logger = new Logger(MenusService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private safeJsonParse<T>(value: any, fallback: T): T {
    if (!value) return fallback;
    if (typeof value !== 'string') return value as T;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  private mapDbToMenuItem(row: any): MenuItem {
    const existing = this.db.menuItems.get(row.id);
    const restaurantName =
      row.restaurant?.name ||
      this.db.restaurants.get(row.restaurantId)?.name ||
      existing?.restaurantName ||
      'Restaurante Saludable';

    const dietaryTags = this.safeJsonParse<string[]>(
      row.dietaryTags,
      existing?.dietaryTags || [],
    );
    const allergens = this.safeJsonParse<string[]>(
      row.allergens,
      existing?.allergens || [],
    );
    const ingredients = this.safeJsonParse<string[]>(
      row.ingredients,
      existing?.ingredients || [],
    );

    const info = row.nutritionalInfo;
    const existingInfo = existing?.nutritionalInfo;

    const nutritionalInfo: NutritionalInfo = {
      calories: info?.calories ?? existingInfo?.calories ?? 0,
      proteinGrams: info?.proteinGrams ?? existingInfo?.proteinGrams ?? 0,
      carbsGrams: info?.carbsGrams ?? existingInfo?.carbsGrams ?? 0,
      fatGrams: info?.fatGrams ?? existingInfo?.fatGrams ?? 0,
      fiberGrams: info?.fiberGrams ?? existingInfo?.fiberGrams ?? 0,
      saturatedFatGrams: existingInfo?.saturatedFatGrams ?? 0,
      sugarGrams: existingInfo?.sugarGrams ?? 0,
      sodiumMg: info?.sodiumMg ?? existingInfo?.sodiumMg ?? 0,
      glycemicIndex: (row.glycemicIndex as any) || existingInfo?.glycemicIndex || 'Bajo',
      nutriScore: (row.nutriScore as any) || existingInfo?.nutriScore || 'A',
      vitaminsAndMinerals: existingInfo?.vitaminsAndMinerals || {},
    };

    return {
      id: row.id,
      restaurantId: row.restaurantId,
      restaurantName,
      name: row.name,
      description: row.description,
      detailedDescription: existing?.detailedDescription || row.description,
      price: row.price,
      imageUrl: row.imageUrl,
      category: row.category,
      portionSizeGrams: existing?.portionSizeGrams || 350,
      ingredients,
      allergens,
      preparationMethod:
        existing?.preparationMethod || 'Cocinado al vapor y grill sin conservantes.',
      dietaryCertifications: existing?.dietaryCertifications || ['Sin Gluten', 'Ingredientes Orgánicos'],
      nutritionalInfo,
      dietaryTags,
      healthGoals: existing?.healthGoals || ['balanced'],
      isPopular: existing?.isPopular ?? true,
      isAvailable: row.isAvailable ?? existing?.isAvailable ?? true,
      rating: existing?.rating ?? 4.8,
      createdAt: row.createdAt ? new Date(row.createdAt) : (existing?.createdAt || new Date()),
    };
  }

  async findAll(): Promise<MenuItem[]> {
    if (this.prisma.connected) {
      try {
        const rows = await this.prisma.menuItem.findMany({
          include: { nutritionalInfo: true, restaurant: true },
        });
        if (rows && rows.length > 0) {
          const items = rows.map((r) => this.mapDbToMenuItem(r));
          for (const item of items) {
            this.db.menuItems.set(item.id, item);
          }
          return items;
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al listar platos desde Prisma: ${error?.message || error}. Usando datos en memoria.`,
        );
      }
    }
    return Array.from(this.db.menuItems.values());
  }

  async findByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    if (this.prisma.connected) {
      try {
        const rows = await this.prisma.menuItem.findMany({
          where: { restaurantId },
          include: { nutritionalInfo: true, restaurant: true },
        });
        if (rows && rows.length > 0) {
          const items = rows.map((r) => this.mapDbToMenuItem(r));
          for (const item of items) {
            this.db.menuItems.set(item.id, item);
          }
          return items;
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al listar platos de restaurante "${restaurantId}" desde Prisma: ${error?.message || error}. Usando datos en memoria.`,
        );
      }
    }
    return Array.from(this.db.menuItems.values()).filter(
      (item) => item.restaurantId === restaurantId,
    );
  }

  async findById(id: string): Promise<MenuItem> {
    const item = this.db.menuItems.get(id);
    if (item) {
      return item;
    }

    if (this.prisma.connected) {
      try {
        const row = await this.prisma.menuItem.findUnique({
          where: { id },
          include: { nutritionalInfo: true, restaurant: true },
        });
        if (row) {
          const mapped = this.mapDbToMenuItem(row);
          this.db.menuItems.set(mapped.id, mapped);
          return mapped;
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al buscar plato con ID "${id}" en Prisma: ${error?.message || error}`,
        );
      }
    }

    throw new NotFoundException(`Plato del menú con ID "${id}" no encontrado`);
  }

  /**
   * HE-HU14-014: Visualizar el detalle nutricional y descripción detallada del menú
   */
  async getNutritionalDetail(id: string): Promise<NutritionalDetailResponse> {
    const item = await this.findById(id);

    const info = item.nutritionalInfo || ({} as any);

    return {
      menuItemId: item.id,
      name: item.name,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurantName,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
      portionSizeGrams: item.portionSizeGrams || 350,
      description: item.description,
      detailedDescription: item.detailedDescription || item.description,
      preparationMethod: item.preparationMethod || 'Cocinado al vapor y grill sin conservantes.',
      nutriScore: info.nutriScore || 'A',
      glycemicIndex: info.glycemicIndex || 'Bajo',
      macronutrients: {
        caloriesKcal: info.calories ?? 0,
        proteinGrams: info.proteinGrams ?? 0,
        carbsGrams: info.carbsGrams ?? 0,
        fatGrams: info.fatGrams ?? 0,
        fiberGrams: info.fiberGrams ?? 0,
        saturatedFatGrams: info.saturatedFatGrams ?? 0,
        sugarGrams: info.sugarGrams ?? 0,
        sodiumMg: info.sodiumMg ?? 0,
      },
      vitaminsAndMinerals: info.vitaminsAndMinerals || {},
      ingredients: item.ingredients || [],
      allergens: item.allergens || [],
      dietaryCertifications: item.dietaryCertifications || [],
      dietaryTags: item.dietaryTags,
      healthGoals: item.healthGoals,
    };
  }

  /**
   * Listar todos los alérgenos identificados en el catálogo de platos
   */
  async getAllergensList(): Promise<{ allergens: string[] }> {
    if (this.prisma.connected) {
      try {
        const rows = await this.prisma.menuItem.findMany({
          select: { allergens: true },
        });
        if (rows && rows.length > 0) {
          const allergensSet = new Set<string>();
          for (const row of rows) {
            const list = this.safeJsonParse<string[]>(row.allergens, []);
            if (Array.isArray(list)) {
              list.forEach((a) => {
                if (a && typeof a === 'string') {
                  allergensSet.add(a);
                }
              });
            }
          }
          return {
            allergens: Array.from(allergensSet),
          };
        }
      } catch (error: any) {
        this.logger.warn(
          `Error al listar alérgenos desde Prisma: ${error?.message || error}. Usando datos en memoria.`,
        );
      }
    }

    const allergensSet = new Set<string>();
    for (const item of this.db.menuItems.values()) {
      if (item.allergens) {
        item.allergens.forEach((a) => allergensSet.add(a));
      }
    }
    return {
      allergens: Array.from(allergensSet),
    };
  }
}
