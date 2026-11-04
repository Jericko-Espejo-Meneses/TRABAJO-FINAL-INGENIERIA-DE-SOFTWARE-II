import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { MenuItem } from '../menus/entities/menu-item.entity';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

export interface RecommendedMenuItem extends MenuItem {
  matchScore: number;
  matchReasons: string[];
}

@Injectable()
export class RecommendationsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * HE-HU3-003: Recomendaciones de menús saludables basadas en objetivos y filtros nutricionales
   */
  async getRecommendations(query: RecommendationQueryDto): Promise<RecommendedMenuItem[]> {
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
