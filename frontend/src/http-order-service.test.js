import { describe, expect, it, vi } from 'vitest';
import { HttpOrderService } from './services/http/HttpOrderService';

describe('Checkout HTTP (pedido y pago)', () => {
  it('crea pedido pendiente, llama al endpoint de pago y devuelve la donación persistida', async () => {
    const http = {
      post: vi.fn()
        .mockResolvedValueOnce({ id: 'HE-1', status: 'PENDING_PAYMENT', total: 28, restaurantName: 'Green Bowl' })
        .mockResolvedValueOnce({
          payment: { paymentMethod: 'credit_card' },
          order: { status: 'CONFIRMED' },
          donation: { donationAmount: 0.84, percentage: 3, foundationName: 'WFP' },
        }),
    };
    const service = new HttpOrderService(http);

    const order = await service.create({
      restaurantId: 'r1',
      items: [{ dishId: 'd1', name: 'Bowl', unitPrice: 28, quantity: 1 }],
      subtotal: 28,
      total: 28,
      donationPercentage: 3,
      donationAmount: 0.84,
      payment: { method: 'card', details: { ultimos4: '4242', token: null } },
      deliveryAddress: 'Calle 1',
    });

    expect(http.post).toHaveBeenNthCalledWith(2, '/payments/process', {
      orderId: 'HE-1', paymentMethod: 'credit_card', cardLast4: '4242',
      walletPhone: undefined, walletOtpCode: undefined,
    });
    expect(order).toMatchObject({ status: 'CONFIRMED', donation: 0.84, donationPercentage: 3, donationFoundation: 'WFP' });
  });

  it('reutiliza el mismo pedido pendiente cuando el usuario reintenta un pago rechazado', async () => {
    const http = {
      post: vi.fn()
        .mockResolvedValueOnce({ id: 'HE-2', status: 'PENDING_PAYMENT' })
        .mockRejectedValueOnce(new Error('Pago rechazado'))
        .mockResolvedValueOnce({
          payment: { paymentMethod: 'yape' },
          order: { status: 'CONFIRMED' },
          donation: { donationAmount: 0.84, percentage: 3, foundationName: 'WFP' },
        }),
    };
    const service = new HttpOrderService(http);
    const request = {
      restaurantId: 'r1',
      items: [{ dishId: 'd1', name: 'Bowl', unitPrice: 28, quantity: 1 }],
      subtotal: 28,
      total: 28,
      payment: { method: 'yape', details: { celular: '987654321', codigo: '000000' } },
      deliveryAddress: 'Calle 1',
    };

    await expect(service.create(request)).rejects.toThrow('Pago rechazado');
    await service.create({ ...request, payment: { method: 'yape', details: { celular: '987654321', codigo: '123456' } } });

    expect(http.post.mock.calls.filter(([path]) => path === '/pedidos')).toHaveLength(1);
    expect(http.post.mock.calls.filter(([path]) => path === '/payments/process')).toHaveLength(2);
  });
});
