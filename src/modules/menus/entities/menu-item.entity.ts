export interface NutritionalInfo {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  saturatedFatGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  glycemicIndex?: 'Bajo' | 'Medio' | 'Alto';
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  vitaminsAndMinerals?: Record<string, string>;
}

export class MenuItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  detailedDescription?: string;
  price: number;
  imageUrl: string;
  category: string;
  portionSizeGrams?: number;
  ingredients?: string[];
  allergens?: string[];
  preparationMethod?: string;
  dietaryCertifications?: string[];
  nutritionalInfo: NutritionalInfo;
  dietaryTags: string[];
  healthGoals: string[];
  isPopular: boolean;
  isAvailable: boolean;
  rating: number;
  createdAt: Date;
}
