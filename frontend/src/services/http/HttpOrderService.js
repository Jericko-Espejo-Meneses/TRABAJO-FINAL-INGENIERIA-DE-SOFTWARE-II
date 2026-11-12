import { OrderService } from '../contracts';
import { toOrder, toOrderDto } from '../../domain/mappers';

export class HttpOrderService extends OrderService {
  constructor(http) { super(); this.http = http; this.pendingOrder = null; }
  async create(orderRequest) {
    const dto = toOrderDto(orderRequest);
    const signature = JSON.stringify({ ...dto, pago: undefined });
    if (!this.pendingOrder || this.pendingOrder.signature !== signature) {
      this.pendingOrder = { signature, order: await this.http.post('/pedidos', dto) };
    }
    const { order } = this.pendingOrder;
    const paymentDetails = orderRequest.payment?.details ?? {};
    const paymentMethod = orderRequest.payment?.method === 'card'
      ? 'credit_card'
      : orderRequest.payment?.method;
    const payment = await this.http.post('/payments/process', {
      orderId: order.id,
      paymentMethod,
      cardLast4: paymentDetails.ultimos4,
      walletPhone: paymentDetails.celular,
      walletOtpCode: paymentDetails.codigo,
    });
    this.pendingOrder = null;

    return toOrder({
      ...order,
      status: payment.order.status,
      paymentMethod: payment.payment.paymentMethod,
      donation: payment.donation,
    });
  }
  async list() { return (await this.http.get('/pedidos')).map(toOrder); }
}
