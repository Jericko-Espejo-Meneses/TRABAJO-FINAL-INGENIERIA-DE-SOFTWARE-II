import { describe, it, expect, vi } from 'vitest';
import { HttpOrderService } from './services/http/HttpOrderService';
import { toOrder } from './domain/mappers';

describe('Donación registrada por el backend', () => {
  it('muestra el monto real y el beneficiario en confirmación e historial', async () => {
    const record = { id: 'HE-1', createdAt: '2026-11-08T12:00:00Z', total: 50, donationId: 'don-1', donation: {
      id: 'don-1', donationAmount: 1.5, percentage: 3,
      foundationName: 'World Food Programme (WFP)',
    } };
    const http = {
      post: vi.fn()
        .mockResolvedValueOnce(record)
        .mockResolvedValueOnce({
          order: { status: 'CONFIRMED' },
          payment: { paymentMethod: 'yape' },
          donation: record.donation,
        }),
      get: vi.fn().mockResolvedValue([record]),
    };
    const service = new HttpOrderService(http);
    const order = await service.create({ items: [], total: 50, payment: { method: 'yape', details: {} } });
    expect(order).toMatchObject({ total: 50, donation: 1.5, donationPercentage: 3, donationFoundation: 'World Food Programme (WFP)' });
    expect((await service.list())[0]).toMatchObject({
      total: order.total,
      donation: order.donation,
      donationPercentage: order.donationPercentage,
      donationFoundation: order.donationFoundation,
    });
  });

  it('no inventa monto ni beneficiario si solo llega el identificador', () => {
    expect(toOrder({ id: 'old', donationId: 'don-1' })).toMatchObject({ donation: null, donationFoundation: null });
  });

  it('conserva beneficiarios históricos y acepta montos cero', () => {
    expect(toOrder({ donation: { amount: 0, foundation: { name: 'Banco de Alimentos Perú' } } }))
      .toMatchObject({ donation: 0, donationFoundation: 'Banco de Alimentos Perú' });
    expect(toOrder({ montoDonacion: 1.5 }).donation).toBe(1.5);
  });
});
