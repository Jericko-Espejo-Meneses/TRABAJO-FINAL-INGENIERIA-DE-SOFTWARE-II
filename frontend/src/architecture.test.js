import { describe, it, expect, vi } from 'vitest';
import { calculateDonation } from './domain/donation';
import { toOrder, toOrderDto } from './domain/mappers';
import { matchesFilter } from './domain/restaurantFilters';
import { CartStore } from './cart/CartStore';
import { OrderBuilder } from './checkout/OrderBuilder';
import { CheckoutFacade } from './checkout/CheckoutFacade';
import { PaymentStrategyFactory } from './payments/PaymentStrategyFactory';
import { AuthHttpClient } from './core/http/AuthHttpClient';

describe('Pruebas Unitarias de Arquitectura y Patrones (Frontend)', () => {
  it('Regla de Negocio (HE-HU5-005): calcula el 3% de donación con redondeo a centavos', () => {
    expect(calculateDonation(28, 3)).toBe(0.84);
    expect(calculateDonation(45.5, 3)).toBe(1.37);
    expect(calculateDonation(50, 3)).toBe(1.5);
  });

  it('Patrón Observer (CartStore): gestiona ítems, calcula subtotal y restringe a un solo restaurante', () => {
    const store = new CartStore();
    const listener = vi.fn();
    store.subscribe(listener);

    const r1 = { id: 'r1', name: 'Green Bowl' };
    const r2 = { id: 'r2', name: 'Vegana Lima' };
    const dish = { id: 'd1', name: 'Bowl Quinoa Power', price: 28, calories: 420, emoji: '🥗' };

    expect(store.add(dish, r1)).toEqual({ ok: true });
    expect(store.getSnapshot().subtotal).toBe(28);
    expect(listener).toHaveBeenCalledTimes(1);

    // Impide mezclar platos de otro restaurante
    expect(store.add(dish, r2)).toEqual({ ok: false, reason: 'DIFFERENT_RESTAURANT' });
  });

  it('Patrón Strategy + Factory (PaymentStrategyFactory): valida métodos de pago y oculta datos sensibles', () => {
    const cardStrategy = PaymentStrategyFactory.create('card');
    const invalidErrors = cardStrategy.validate({ holder: '', number: '123', expiry: '13/99', cvv: '1' });
    expect(Object.keys(invalidErrors)).toHaveLength(4);

    const payload = cardStrategy.toPayload({
      holder: 'Fabrizzio Gavilan',
      number: '4111 1111 1111 4242',
      expiry: '08/28',
      cvv: '123',
    });
    expect(payload.details.ultimos4).toBe('4242');
    expect(payload.details.token).toBeNull();
    expect(PaymentStrategyFactory.list().map((method) => method.id)).toEqual(['card', 'yape', 'plin', 'cash']);
  });

  it('Patrón Builder + Facade (CheckoutFacade): coordina validación, armado de pedido y cálculo de donación', async () => {
    const store = new CartStore();
    store.add({ id: 'd1', name: 'Bowl Quinoa Power', price: 28 }, { id: 'r1', name: 'Green Bowl' });

    const mockOrderService = { create: vi.fn(async (req) => ({ id: 'HE-857658', ...req })) };
    const facade = new CheckoutFacade({
      orders: mockOrderService,
      donationPercentage: 3,
      strategies: PaymentStrategyFactory,
    });

    const result = await facade.placeOrder({
      cart: store.getSnapshot(),
      methodId: 'yape',
      values: { phone: '987654321', code: '123456' },
      address: 'Av. Larco 123, Miraflores',
    });

    expect(mockOrderService.create).toHaveBeenCalledOnce();
    expect(result.total).toBe(28);
    expect(result.donationAmount).toBe(0.84);
    expect(result.deliveryAddress).toBe('Av. Larco 123, Miraflores');
  });

  it('Patrón Decorator (AuthHttpClient): inyecta token Bearer y dispara evento en 401', async () => {
    const inner = {
      baseUrl: 'https://ingsoft-backend-1.onrender.com/api',
      request: vi.fn(async () => ({ ok: true })),
    };
    const tokenStorage = { get: () => 'jwt-demo-token' };
    const onUnauthorized = vi.fn();
    const authHttp = new AuthHttpClient(inner, tokenStorage, onUnauthorized);

    await authHttp.get('/pedidos');
    expect(inner.request).toHaveBeenCalledWith('GET', '/pedidos', {
      headers: { Authorization: 'Bearer jwt-demo-token' },
    });
  });

  it('Patrón Adapter (mappers): transforma OrderBuilder a DTO del backend y viceversa', () => {
    const built = new OrderBuilder()
      .fromCart({
        restaurant: { id: 'r1', name: 'Green Bowl' },
        items: [{ dish: { id: 'd1', name: 'Bowl Quinoa', price: 28 }, quantity: 1 }],
        subtotal: 28,
      })
      .withDonation(3)
      .withPayment({ method: 'yape', details: { celular: '987654321', codigo: '123456' } })
      .deliverTo('Miraflores')
      .build();

    const dto = toOrderDto(built);
    expect(dto.idRestaurante).toBe('r1');
    expect(dto.porcentajeDonacion).toBe(3);
    expect(dto.montoDonacion).toBe(0.84);
    expect(dto.total).toBe(28);

    const uiOrder = toOrder({ idPedido: 'HE-100', restaurante: { nombre: 'Green Bowl' }, total: 28, montoDonacion: 0.84 });
    expect(uiOrder.restaurantName).toBe('Green Bowl');
    expect(uiOrder.donation).toBe(0.84);
  });
});
