import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Restaurant } from './entities/restaurant.entity';
import { SearchRestaurantsDto } from './dto/search-restaurants.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * HE-HU2-002: Búsqueda y filtrado de restaurantes con opciones saludables
   */
  async search(dto: SearchRestaurantsDto): Promise<Restaurant[]> {
    let results = Array.from(this.db.restaurants.values());

    const searchQuery = dto.query || dto.q;
    const categoryQuery = dto.category || dto.tipoComida;
    const tagQuery = dto.dietaryTag || (Array.isArray(dto.tags) ? dto.tags[0] : dto.tags);

    // 1. Filtrar por término de búsqueda (nombre, descripción, categoría)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.dietaryTags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    // 2. Filtrar por categoría
    if (categoryQuery) {
      const cat = categoryQuery.toLowerCase().trim();
      results = results.filter((r) => r.category.toLowerCase().includes(cat));
    }

    // 3. Filtrar por etiqueta dietética saludable (vegano, keto, sin gluten, etc.)
    if (tagQuery) {
      const tq = String(tagQuery).toLowerCase().trim();
      results = results.filter((r) =>
        r.dietaryTags.some((t) => t.toLowerCase().includes(tq)),
      );
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

    return results;
  }

  async findAll(queryDto?: SearchRestaurantsDto): Promise<Restaurant[]> {
    if (queryDto && (queryDto.query || queryDto.q || queryDto.category || queryDto.tipoComida || queryDto.dietaryTag || queryDto.tags)) {
      return this.search(queryDto);
    }
    return Array.from(this.db.restaurants.values());
  }

  async findById(id: string): Promise<Restaurant & { menu: any[] }> {
    const restaurant = this.db.restaurants.get(id);
    if (!restaurant) {
      throw new NotFoundException(`Restaurante con ID "${id}" no encontrado`);
    }

    const menu = Array.from(this.db.menuItems.values()).filter(
      (item) => item.restaurantId === id,
    );

    return {
      ...restaurant,
      menu,
    };
  }

  async getCategories(): Promise<{ categories: string[]; dietaryTags: string[] }> {
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
