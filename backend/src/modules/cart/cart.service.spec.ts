import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { DatabaseService } from '../../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('CartService (Sprint 3: HE-HU4-004)', () => {
  let service: CartService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, DatabaseService],
    }).compile();

    service = module.get<CartService>(CartService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('debe iniciar con un carrito vacío si es la primera vez', async () => {
    const cart = await service.getCart('test-user-1');
    expect(cart).toBeDefined();
    expect(cart.items.length).toBe(0);
    expect(cart.total).toBe(0);
    expect(cart.totalNutrition.calories).toBe(0);
  });

  it('debe agregar un producto al carrito y calcular subtotales y macronutrientes acumulados', async () => {
    const cart = await service.addItem('test-user-1', {
      menuItemId: 'menu-1',
      quantity: 2,
      specialInstructions: 'Sin cebolla',
    });

    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.items[0].specialInstructions).toBe('Sin cebolla');
    expect(cart.subtotal).toBe(57.0); // 28.5 * 2
    expect(cart.totalNutrition.calories).toBe(900); // 450 * 2
    expect(cart.totalNutrition.proteinGrams).toBe(70); // 35 * 2
    expect(cart.total).toBeGreaterThan(cart.subtotal); // Incluye delivery fee
  });

  it('debe actualizar la cantidad de un ítem y recalcular los totales', async () => {
    const initialCart = await service.addItem('test-user-2', {
      menuItemId: 'menu-1',
      quantity: 1,
    });
    const itemId = initialCart.items[0].id;

    const updatedCart = await service.updateItem('test-user-2', itemId, {
      quantity: 3,
    });

    expect(updatedCart.items[0].quantity).toBe(3);
    expect(updatedCart.subtotal).toBe(85.5);
    expect(updatedCart.totalNutrition.calories).toBe(1350);
  });

  it('debe eliminar un ítem del carrito', async () => {
    const initialCart = await service.addItem('test-user-3', {
      menuItemId: 'menu-1',
      quantity: 1,
    });
    const itemId = initialCart.items[0].id;

    const updatedCart = await service.removeItem('test-user-3', itemId);
    expect(updatedCart.items.length).toBe(0);
    expect(updatedCart.subtotal).toBe(0);
    expect(updatedCart.totalNutrition.calories).toBe(0);
  });

  it('debe vaciar el carrito completamente', async () => {
    await service.addItem('test-user-4', {
      menuItemId: 'menu-1',
      quantity: 2,
    });

    const clearedCart = await service.clearCart('test-user-4');
    expect(clearedCart.items.length).toBe(0);
    expect(clearedCart.total).toBe(0);
  });

  it('debe lanzar NotFoundException si el producto no existe', async () => {
    await expect(
      service.addItem('test-user-5', {
        menuItemId: 'non-existent-menu-id',
        quantity: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
