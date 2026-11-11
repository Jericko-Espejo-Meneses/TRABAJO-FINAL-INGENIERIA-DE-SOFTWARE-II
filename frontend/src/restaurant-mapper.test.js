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

  it('usa el banner o logo que entrega Prisma como imagen del restaurante', () => {
    expect(toRestaurant({ id: 'r1', bannerUrl: 'https://example.test/banner.jpg', logoUrl: 'https://example.test/logo.jpg' }).imageUrl)
      .toBe('https://example.test/banner.jpg');
    expect(toRestaurant({ id: 'r2', logoUrl: 'https://example.test/logo.jpg' }).imageUrl)
      .toBe('https://example.test/logo.jpg');
  });
});
