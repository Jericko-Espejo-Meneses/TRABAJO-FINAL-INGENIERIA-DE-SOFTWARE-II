import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FavoritesService (Sprint 8: HE-HU12-012)', () => {
  let service: FavoritesService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        DatabaseService,
        // Estos casos ejercitan los datos de prueba en memoria.
        { provide: PrismaService, useValue: { connected: false } },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('HE-HU12-012: debe listar favoritos (restaurantes y platos) del usuario', async () => {
    const favs = await service.getUserFavorites('user-demo-1');
    expect(favs).toBeDefined();
    expect(favs.favoriteRestaurants.length).toBeGreaterThan(0);
    expect(favs.favoriteMenuItems.length).toBeGreaterThan(0);
    expect(favs.totalCount).toBeGreaterThanOrEqual(2);
  });

  it('HE-HU12-012: debe agregar un nuevo restaurante a favoritos', async () => {
    const fav = await service.addFavorite('test-fav-user', 'RESTAURANT', 'rest-2');
    expect(fav).toBeDefined();
    expect(fav.type).toBe('RESTAURANT');
    expect(fav.targetId).toBe('rest-2');

    const status = await service.isFavorite('test-fav-user', 'RESTAURANT', 'rest-2');
    expect(status.isFavorite).toBe(true);
  });

  it('HE-HU12-012: debe agregar un nuevo plato a favoritos', async () => {
    const fav = await service.addFavorite('test-fav-user', 'MENU_ITEM', 'menu-3');
    expect(fav).toBeDefined();
    expect(fav.type).toBe('MENU_ITEM');
    expect(fav.targetId).toBe('menu-3');
  });

  it('HE-HU12-012: debe alternar (toggle) un elemento de favoritos correctamente', async () => {
    // 1. Toggle ON
    const toggleOn = await service.toggleFavorite('toggle-user', {
      type: 'MENU_ITEM',
      targetId: 'menu-4',
    });
    expect(toggleOn.isFavorite).toBe(true);

    // 2. Toggle OFF
    const toggleOff = await service.toggleFavorite('toggle-user', {
      type: 'MENU_ITEM',
      targetId: 'menu-4',
    });
    expect(toggleOff.isFavorite).toBe(false);
  });

  it('HE-HU12-012: debe remover un elemento de favoritos', async () => {
    await service.addFavorite('remove-fav-user', 'RESTAURANT', 'rest-1');
    const result = await service.removeFavorite('remove-fav-user', 'RESTAURANT', 'rest-1');
    expect(result.success).toBe(true);

    const status = await service.isFavorite('remove-fav-user', 'RESTAURANT', 'rest-1');
    expect(status.isFavorite).toBe(false);
  });

  it('HE-HU12-012: debe lanzar NotFoundException si el restaurante o plato no existe', async () => {
    await expect(
      service.addFavorite('user-1', 'RESTAURANT', 'non-existent-rest'),
    ).rejects.toThrow(NotFoundException);

    await expect(
      service.addFavorite('user-1', 'MENU_ITEM', 'non-existent-menu'),
    ).rejects.toThrow(NotFoundException);
  });
});
