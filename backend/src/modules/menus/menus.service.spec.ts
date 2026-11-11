import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MenusService (Sprint 8: HE-HU14-014)', () => {
  let service: MenusService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        DatabaseService,
        // Estos casos ejercitan los datos de prueba en memoria.
        { provide: PrismaService, useValue: { connected: false } },
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('HE-HU14-014: debe retornar el detalle nutricional completo y descripción del menú', async () => {
    const detail = await service.getNutritionalDetail('menu-1');

    expect(detail).toBeDefined();
    expect(detail.name).toBe('Bowl Quinoa & Pollo Grill Proteico');
    expect(detail.portionSizeGrams).toBeGreaterThan(0);
    expect(detail.detailedDescription).toBeDefined();
    expect(detail.preparationMethod).toBeDefined();
    expect(detail.nutriScore).toBe('A');

    // Desglose de macronutrientes
    expect(detail.macronutrients.caloriesKcal).toBe(450);
    expect(detail.macronutrients.proteinGrams).toBe(35);
    expect(detail.macronutrients.carbsGrams).toBe(42);
    expect(detail.macronutrients.fatGrams).toBe(14);
    expect(detail.macronutrients.fiberGrams).toBe(9);

    // Ingredientes y alérgenos
    expect(Array.isArray(detail.ingredients)).toBe(true);
    expect(detail.ingredients.length).toBeGreaterThan(0);
    expect(Array.isArray(detail.allergens)).toBe(true);

    // Vitaminas y minerales
    expect(detail.vitaminsAndMinerals).toBeDefined();
    expect(Object.keys(detail.vitaminsAndMinerals).length).toBeGreaterThan(0);
  });

  it('HE-HU14-014: debe identificar alérgenos en platos como salmón y frutos secos', async () => {
    const detail = await service.getNutritionalDetail('menu-2');
    expect(detail.allergens).toContain('Pescado');
    expect(detail.allergens).toContain('Frutos secos (Nueces)');
  });

  it('HE-HU14-014: debe listar el catálogo consolidado de alérgenos identificados', async () => {
    const { allergens } = await service.getAllergensList();
    expect(allergens.length).toBeGreaterThan(0);
    expect(allergens).toContain('Pescado');
  });

  it('debe lanzar NotFoundException si el plato no existe', async () => {
    await expect(
      service.getNutritionalDetail('non-existent-menu'),
    ).rejects.toThrow(NotFoundException);
  });
});
