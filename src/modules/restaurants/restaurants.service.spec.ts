import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { DatabaseService } from '../../database/database.service';

describe('RestaurantsService (Sprint 2: HE-HU2-002)', () => {
  let service: RestaurantsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RestaurantsService, DatabaseService],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('debe listar restaurantes saludables filtrados por término de búsqueda', async () => {
    const results = await service.search({ query: 'GreenBowl' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('GreenBowl');
  });

  it('debe filtrar restaurantes por etiqueta dietética saludable (vegano)', async () => {
    const results = await service.search({ dietaryTag: 'vegano' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.dietaryTags.some((t) => t.toLowerCase().includes('vegano'))).toBe(true);
    });
  });

  it('debe filtrar restaurantes por calificación mínima', async () => {
    const results = await service.search({ minRating: 4.8 });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.rating).toBeGreaterThanOrEqual(4.8);
    });
  });

  it('debe recuperar el detalle de un restaurante con su catálogo de menú', async () => {
    const restaurant = await service.findById('rest-1');
    expect(restaurant).toBeDefined();
    expect(restaurant.name).toBe('GreenBowl Healthy Bar');
    expect(Array.isArray(restaurant.menu)).toBe(true);
    expect(restaurant.menu.length).toBeGreaterThan(0);
  });
});
