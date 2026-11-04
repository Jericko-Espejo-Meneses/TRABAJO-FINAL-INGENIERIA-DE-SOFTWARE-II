import { OrderService } from '../contracts';
import { db, delay, persist, userIdFromToken } from './db';
import { restaurants } from './data';

export class MockOrderService extends OrderService {
  constructor(tokenStorage) { super(); this.tokenStorage = tokenStorage; }

  async create(req) {
    await delay(700);
    const order = {
      id: `HE-${Date.now().toString().slice(-6)}`,
      userId: userIdFromToken(this.tokenStorage.get()),
      restaurantName: restaurants.find((r) => r.id === req.restaurantId)?.name ?? 'Restaurante',
      createdAt: new Date().toISOString(),
      subtotal: req.subtotal,
      donation: req.donationAmount,
      total: req.total,
      status: 'confirmed',
      paymentMethod: req.payment.method,
      items: req.items.map(({ name, quantity, unitPrice }) => ({ name, quantity, unitPrice })),
    };
    db.orders.unshift(order);
    persist();
    return order;
  }

  async list() {
    await delay(250);
    const userId = userIdFromToken(this.tokenStorage.get());
    return db.orders.filter((o) => o.userId === userId);
  }
}
