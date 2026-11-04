import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { MenuItem } from './entities/menu-item.entity';

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
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<MenuItem[]> {
    return Array.from(this.db.menuItems.values());
  }

  async findByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    return Array.from(this.db.menuItems.values()).filter(
      (item) => item.restaurantId === restaurantId,
    );
  }

  async findById(id: string): Promise<MenuItem> {
    const item = this.db.menuItems.get(id);
    if (!item) {
      throw new NotFoundException(`Plato del menú con ID "${id}" no encontrado`);
    }
    return item;
  }

  /**
   * HE-HU14-014: Visualizar el detalle nutricional y descripción detallada del menú
   */
  async getNutritionalDetail(id: string): Promise<NutritionalDetailResponse> {
    const item = await this.findById(id);

    const info = item.nutritionalInfo;

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
        caloriesKcal: info.calories,
        proteinGrams: info.proteinGrams,
        carbsGrams: info.carbsGrams,
        fatGrams: info.fatGrams,
        fiberGrams: info.fiberGrams || 0,
        saturatedFatGrams: info.saturatedFatGrams || 0,
        sugarGrams: info.sugarGrams || 0,
        sodiumMg: info.sodiumMg || 0,
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
