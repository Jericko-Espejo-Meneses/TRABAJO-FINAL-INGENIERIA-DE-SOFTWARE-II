import { Injectable, Optional, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MenuItem } from '../menus/entities/menu-item.entity';
import { User } from '../users/entities/user.entity';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

export interface RecommendedMenuItem extends MenuItem {
  matchScore: number;
  matchReasons: string[];
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  /**
   * HE-HU3-003: Recomendaciones de menús saludables basadas en objetivos y filtros nutricionales
   */
  async getRecommendations(query: RecommendationQueryDto): Promise<RecommendedMenuItem[]> {
    await this.syncMenuItemsFromDb();

    const items = Array.from(this.db.menuItems.values()).filter((i) => i.isAvailable);

    const scoredItems: RecommendedMenuItem[] = [];

    for (const item of items) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Objetivo de salud
      if (query.healthGoal) {
        if (item.healthGoals.includes(query.healthGoal)) {
          score += 40;
          reasons.push(`Alineado con tu objetivo: ${this.translateGoal(query.healthGoal)}`);
        }
      }

      // 2. Etiqueta dietética
      if (query.dietaryTag) {
        const tag = query.dietaryTag.toLowerCase().trim();
        const matches = item.dietaryTags.some((t) => t.toLowerCase().includes(tag));
        if (matches) {
          score += 30;
          reasons.push(`Cumple con tu preferencia: ${query.dietaryTag}`);
        } else {
          // Si el usuario especificó una restricción estricta (ej. vegano) y no coincide, descartar
          if (['vegano', 'vegetariano', 'sin gluten'].includes(tag)) {
            continue;
          }
        }
      }

      // 3. Filtro de calorías máximas
      if (query.maxCalories !== undefined) {
        if (item.nutritionalInfo.calories <= query.maxCalories) {
          score += 20;
          reasons.push(`Dentro de tu rango calórico (${item.nutritionalInfo.calories} kcal)`);
        } else {
          continue; // Supera el límite de calorías solicitado
        }
      }

      // 4. Filtro de proteína mínima
      if (query.minProtein !== undefined) {
        if (item.nutritionalInfo.proteinGrams >= query.minProtein) {
          score += 20;
          reasons.push(`Aporte proteico excelente (${item.nutritionalInfo.proteinGrams}g)`);
        } else {
          continue; // No alcanza la proteína requerida
        }
      }

      // 5. Filtro de precio
      if (query.maxPrice !== undefined) {
        if (item.price <= query.maxPrice) {
          score += 10;
        } else {
          continue; // Supera el precio máximo
        }
      }

      // Puntos adicionales por popularidad y calificación del plato
      if (item.isPopular) {
        score += 10;
        reasons.push('Plato favorito de la comunidad HealthExpress');
      }
      score += Math.round(item.rating * 5); // hasta 25 puntos

      scoredItems.push({
        ...item,
        matchScore: score,
        matchReasons: reasons.length > 0 ? reasons : ['Opción saludable recomendada'],
      });
    }

    // Ordenar de mayor a menor puntuación de coincidencia
    scoredItems.sort((a, b) => b.matchScore - a.matchScore);

    const limit = query.limit || 10;
    return scoredItems.slice(0, limit);
  }

  /**
   * HE-HU3-003: Recomendaciones personalizadas basadas en el perfil del usuario autenticado
   */
  async getPersonalizedRecommendations(userId: string): Promise<RecommendedMenuItem[]> {
    await this.syncMenuItemsFromDb();
    await this.syncUserFromDb(userId);

    const user = this.db.users.get(userId);
    const userGoals = user?.healthGoals || ['balanced'];
    const userDietary = user?.dietaryPreferences || [];

    const items = Array.from(this.db.menuItems.values()).filter((i) => i.isAvailable);

    const scored: RecommendedMenuItem[] = items.map((item) => {
      let score = 0;
      const reasons: string[] = [];

      // Coincidencia con objetivos de salud del usuario
      userGoals.forEach((goal) => {
        if (item.healthGoals.includes(goal)) {
          score += 35;
          reasons.push(`Recomendado según tu meta: ${this.translateGoal(goal)}`);
        }
      });

      // Coincidencia con preferencias dietéticas del usuario
      userDietary.forEach((diet) => {
        if (item.dietaryTags.some((t) => t.toLowerCase().includes(diet.toLowerCase()))) {
          score += 30;
          reasons.push(`Compatible con tu preferencia: ${diet}`);
        }
      });

      if (item.isPopular) {
        score += 15;
        reasons.push('Top calificado en nutrición');
      }

      score += Math.round(item.rating * 5);

      return {
        ...item,
        matchScore: score,
        matchReasons: reasons.length > 0 ? reasons : ['Sugerencia saludable general'],
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, 10);
  }

  /**
   * HE-HU3-003: Menús destacados del día curados por nutricionistas
   */
  async getFeaturedRecommendations(): Promise<RecommendedMenuItem[]> {
    await this.syncMenuItemsFromDb();

    const items = Array.from(this.db.menuItems.values())
      .filter((i) => i.isAvailable && i.rating >= 4.7)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        matchScore: 95,
        matchReasons: ['Selección del Chef & Nutricionista HealthExpress'],
      }));

    return items;
  }

  /**
   * Carga platos disponibles desde PostgreSQL/Prisma al almacén en memoria
   */
  private async syncMenuItemsFromDb(): Promise<void> {
    try {
      if (!this.prisma?.connected) {
        return;
      }

      const dbItems = await this.prisma.menuItem.findMany({
        include: {
          nutritionalInfo: true,
          restaurant: true,
        },
      });

      if (!dbItems || dbItems.length === 0) {
        return;
      }

      for (const dbItem of dbItems) {
        const existing = this.db.menuItems.get(dbItem.id);

        let dietaryTags: string[] = [];
        try {
          dietaryTags = typeof dbItem.dietaryTags === 'string'
            ? JSON.parse(dbItem.dietaryTags)
            : (Array.isArray(dbItem.dietaryTags) ? dbItem.dietaryTags : []);
        } catch {
          dietaryTags = [];
        }

        let allergens: string[] = [];
        try {
          allergens = typeof dbItem.allergens === 'string'
            ? JSON.parse(dbItem.allergens)
            : (Array.isArray(dbItem.allergens) ? dbItem.allergens : []);
        } catch {
          allergens = [];
        }

        let ingredients: string[] = [];
        try {
          ingredients = typeof dbItem.ingredients === 'string'
            ? JSON.parse(dbItem.ingredients)
            : (Array.isArray(dbItem.ingredients) ? dbItem.ingredients : []);
        } catch {
          ingredients = [];
        }

        const calories = dbItem.nutritionalInfo?.calories ?? existing?.nutritionalInfo?.calories ?? 400;
        const proteinGrams = dbItem.nutritionalInfo?.proteinGrams ?? existing?.nutritionalInfo?.proteinGrams ?? 20;
        const carbsGrams = dbItem.nutritionalInfo?.carbsGrams ?? existing?.nutritionalInfo?.carbsGrams ?? 35;
        const fatGrams = dbItem.nutritionalInfo?.fatGrams ?? existing?.nutritionalInfo?.fatGrams ?? 12;

        let healthGoals = existing?.healthGoals;
        if (!healthGoals || healthGoals.length === 0) {
          healthGoals = ['balanced'];
          if (proteinGrams >= 25 || dietaryTags.some((t) => t.toLowerCase().includes('proteina'))) {
            healthGoals.push('muscle_gain');
          }
          if (calories <= 450 || dietaryTags.some((t) => t.toLowerCase().includes('caloria') || t.toLowerCase().includes('keto'))) {
            healthGoals.push('weight_loss');
          }
          if (dietaryTags.some((t) => t.toLowerCase().includes('keto'))) {
            healthGoals.push('keto');
          }
        }

        const menuItem: MenuItem = {
          id: dbItem.id,
          restaurantId: dbItem.restaurantId,
          restaurantName: (dbItem as any).restaurant?.name || existing?.restaurantName || 'Restaurante Saludable',
          name: dbItem.name,
          description: dbItem.description,
          detailedDescription: existing?.detailedDescription || dbItem.description,
          price: dbItem.price,
          imageUrl: dbItem.imageUrl,
          category: dbItem.category,
          portionSizeGrams: existing?.portionSizeGrams || 350,
          ingredients: ingredients.length > 0 ? ingredients : existing?.ingredients || [],
          allergens: allergens.length > 0 ? allergens : existing?.allergens || [],
          preparationMethod: existing?.preparationMethod || 'Cocinado con técnicas saludables e ingredientes naturales.',
          dietaryCertifications: existing?.dietaryCertifications || [],
          nutritionalInfo: {
            calories,
            proteinGrams,
            carbsGrams,
            fatGrams,
            fiberGrams: dbItem.nutritionalInfo?.fiberGrams ?? existing?.nutritionalInfo?.fiberGrams ?? 5,
            saturatedFatGrams: existing?.nutritionalInfo?.saturatedFatGrams ?? 2,
            sugarGrams: existing?.nutritionalInfo?.sugarGrams ?? 3,
            sodiumMg: dbItem.nutritionalInfo?.sodiumMg ?? existing?.nutritionalInfo?.sodiumMg ?? 300,
            glycemicIndex: (dbItem.glycemicIndex as any) ?? existing?.nutritionalInfo?.glycemicIndex ?? 'Bajo',
            nutriScore: (dbItem.nutriScore as any) ?? existing?.nutritionalInfo?.nutriScore ?? 'A',
            vitaminsAndMinerals: existing?.nutritionalInfo?.vitaminsAndMinerals || {},
          },
          dietaryTags: dietaryTags.length > 0 ? dietaryTags : existing?.dietaryTags || [],
          healthGoals,
          isPopular: existing?.isPopular ?? false,
          isAvailable: dbItem.isAvailable,
          rating: existing?.rating ?? 4.8,
          createdAt: dbItem.createdAt || existing?.createdAt || new Date(),
        };

        this.db.menuItems.set(menuItem.id, menuItem);
      }
    } catch (error: any) {
      this.logger.warn(`Error al sincronizar platos desde Prisma: ${error?.message || error}`);
    }
  }

  /**
   * Carga un usuario desde PostgreSQL/Prisma al almacén en memoria si no está presente
   */
  private async syncUserFromDb(userId: string): Promise<void> {
    try {
      if (!this.prisma?.connected) {
        return;
      }

      if (this.db.users.has(userId)) {
        return;
      }

      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { addresses: true },
      });

      if (!dbUser) {
        return;
      }

      let dietaryPreferences: string[] = [];
      try {
        dietaryPreferences = typeof dbUser.dietaryPreferences === 'string'
          ? JSON.parse(dbUser.dietaryPreferences)
          : (Array.isArray(dbUser.dietaryPreferences) ? dbUser.dietaryPreferences : []);
      } catch {
        dietaryPreferences = [];
      }

      let healthGoals: string[] = [];
      try {
        healthGoals = typeof dbUser.healthGoals === 'string'
          ? JSON.parse(dbUser.healthGoals)
          : (Array.isArray(dbUser.healthGoals) ? dbUser.healthGoals : []);
      } catch {
        healthGoals = [];
      }

      const user: User = {
        id: dbUser.id,
        email: dbUser.email,
        passwordHash: dbUser.passwordHash || undefined,
        fullName: dbUser.fullName,
        phone: dbUser.phone || undefined,
        provider: (dbUser.provider as any) || 'email',
        providerId: dbUser.providerId || undefined,
        avatarUrl: dbUser.avatarUrl || undefined,
        dietaryPreferences,
        healthGoals: healthGoals.length > 0 ? healthGoals : ['balanced'],
        addresses: dbUser.addresses?.map((a) => ({
          id: a.id,
          label: a.label,
          street: a.street,
          city: a.city,
          reference: a.reference || undefined,
          isDefault: a.isDefault,
        })) || [],
        createdAt: dbUser.createdAt || new Date(),
        updatedAt: dbUser.updatedAt || new Date(),
      };

      this.db.users.set(user.id, user);
    } catch (error: any) {
      this.logger.warn(`Error al sincronizar usuario "${userId}" desde Prisma: ${error?.message || error}`);
    }
  }

  private translateGoal(goal: string): string {
    const map: Record<string, string> = {
      weight_loss: 'Pérdida de peso y control calórico',
      muscle_gain: 'Desarrollo muscular (alto en proteína)',
      keto: 'Dieta Cetogénica (baja en carbos)',
      detox: 'Desintoxicación y antioxidantes',
      balanced: 'Nutrición balanceada diaria',
    };
    return map[goal] || goal;
  }
}
