import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Restaurant } from './entities/restaurant.entity';

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

  describe('Distancia y filtros combinados del catálogo', () => {
    const origin = { lat: 0, lng: 0 };
    const latitudeAtKm = (km: number) => km / 6371 * 180 / Math.PI;
    beforeEach(() => {
      const base = db.restaurants.get('rest-1')!;
      db.restaurants.clear();
      const fixtures = [
        { id: 'near', latitude: latitudeAtKm(0.5), priceLevel: '$', dietaryTags: ['Vegano', 'Bajo en calorías', 'Alto en proteína'] },
        { id: 'middle', latitude: latitudeAtKm(1.5), priceLevel: '$$', dietaryTags: ['vegano', 'bajo en calorias'] },
        { id: 'far', latitude: latitudeAtKm(2.5), priceLevel: '$', dietaryTags: ['alto en proteina'] },
        { id: 'outside', latitude: latitudeAtKm(1.004), priceLevel: '$$', dietaryTags: [] },
        { id: 'unknown', latitude: undefined, priceLevel: '$', dietaryTags: ['vegano'] },
      ];
      fixtures.forEach((f) => db.restaurants.set(f.id, { ...base, longitude: 0, ...f } as Restaurant));
    });

    it.each([
      [{ distanciaMax: 1 }, ['near']],
      [{ distanciaMax: 2 }, ['near', 'middle', 'outside']],
      [{ tags: 'nearby' }, ['near', 'middle', 'outside']],
      [{ tags: ['nearby', 'cheap'] }, ['near']],
      [{ tags: ['vegan', 'high-protein'] }, ['near']],
      [{ tags: 'vegan,low-calorie' }, ['near', 'middle']],
      [{ dietaryTag: 'vegano', tags: ['cheap'] }, ['near', 'unknown']],
      [{ tags: ['cheap'], distanciaMax: 3 }, ['near', 'far']],
      [{ tags: ['nearby'], distanciaMax: 1 }, ['near']],
      [{ tags: ['nearby'], distanciaMax: 3 }, ['near', 'middle', 'outside']],
      [{ q: 'green', tipoComida: 'ensaladas', tags: ['vegan', 'cheap'], distanciaMax: 2 }, ['near']],
      [{ tags: ['not-a-tag'] }, []],
    ])('aplica todos los criterios de %j', async (criteria, ids) => {
      const results = await service.findAll({ ...origin, ...criteria });
      expect(results.map((r) => r.id).sort()).toEqual([...ids].sort());
    });

    it('no incluye un restaurante fuera del radio aunque redondee a 1 km', async () => {
      const results = await service.search({ ...origin, distanciaMax: 1 });
      expect(results.map((r) => r.id)).not.toContain('outside');
    });

    it('acepta radio cero y coordenadas cero; no contamina búsquedas posteriores', async () => {
      db.restaurants.get('near')!.latitude = 0;
      expect((await service.findAll({ ...origin, distanciaMax: 0 })).map((r) => r.id)).toEqual(['near']);
      expect((await service.findAll()).every((r) => r.distanceKm === null)).toBe(true);
      expect(db.restaurants.get('near')!.distanceKm).toBeUndefined();
    });

    it('rechaza filtros de distancia sin coordenadas completas', async () => {
      await expect(service.findAll({ distanciaMax: 1 })).rejects.toThrow('requieren lat y lng');
      await expect(service.findAll({ tags: 'nearby' })).rejects.toThrow('requieren lat y lng');
      await expect(service.findAll({ lat: 0 })).rejects.toThrow('juntos');
    });

    it('aplica filtros numéricos también en GET /restaurantes', async () => {
      expect(await service.findAll({ minRating: 5 })).toEqual([]);
      expect(await service.findAll({ maxDeliveryTime: 5 })).toEqual([]);
      expect(await service.findAll({ isHealthyCertified: false })).toEqual([]);
    });

    it('conserva las coordenadas de PostgreSQL y no usa la demo si la tabla está vacía', async () => {
      const prisma = { connected: true, restaurant: { findMany: jest.fn().mockResolvedValue([
        { ...db.restaurants.get('near'), latitude: latitudeAtKm(0.5), longitude: 0,
          foodType: 'Ensaladas', dietaryTags: '["vegano"]', priceLevel: 1 },
        { ...db.restaurants.get('far'), latitude: latitudeAtKm(3), longitude: 0,
          foodType: 'Ensaladas', dietaryTags: '["vegano"]', priceLevel: 1 },
      ]) } };
      const persistent = new RestaurantsService(db, prisma as unknown as PrismaService);
      const results = await persistent.findAll({ ...origin, distanciaMax: 1, tags: ['vegan', 'cheap'] });
      expect(results.map((r) => r.id)).toEqual(['near']);
      expect(results[0].distanceKm).toBe(0.5);
      prisma.restaurant.findMany.mockResolvedValue([]);
      expect(await persistent.findAll()).toEqual([]);
    });
  });
});
