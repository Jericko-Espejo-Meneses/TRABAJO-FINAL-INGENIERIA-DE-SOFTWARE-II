import { describe, expect, it } from 'vitest';
import { toRestaurant } from './domain/mappers';

describe('Catálogo del backend real', () => {
  it('muestra categoría, distancia, etiquetas y precio recibidos de NestJS', () => {
    expect(toRestaurant({ id: 'r1', category: 'Comida Vegana', distanceKm: 0.5,
      dietaryTags: ['vegano'], priceLevel: '$' })).toMatchObject({
      foodType: 'Comida Vegana', distanceKm: 0.5, tags: ['vegano'], priceLevel: 1,
    });
  });
  it('conserva el contrato anterior y una distancia de cero', () => {
    expect(toRestaurant({ tipoComida: 'Ensaladas', distanciaKm: 0,
      etiquetas: ['vegan'], nivelPrecio: 2 })).toMatchObject({
      foodType: 'Ensaladas', distanceKm: 0, tags: ['vegan'], priceLevel: 2,
    });
  });
});
