import { calculateDonation } from '../domain/donation';

// PATRÓN BUILDER: arma paso a paso la solicitud de pedido (objeto complejo) y
// valida que esté completa antes de entregarla.
export class OrderBuilder {
  #order = { items: [], donationPercentage: 0, donationAmount: 0 };

  fromCart(cart) {
    this.#order.restaurantId = cart.restaurant?.id;
    this.#order.items = cart.items.map(({ dish, quantity }) => ({
      dishId: dish.id, name: dish.name, unitPrice: dish.price, quantity,
    }));
    this.#order.subtotal = cart.subtotal;
    this.#order.total = cart.subtotal;
    return this;
  }

  withDonation(percentage) {
    this.#order.donationPercentage = percentage;
    this.#order.donationAmount = calculateDonation(this.#order.subtotal ?? 0, percentage);
    return this;
  }

  withPayment(payment) { this.#order.payment = payment; return this; }
  deliverTo(address) { this.#order.deliveryAddress = address; return this; }

  build() {
    const o = this.#order;
    if (!o.restaurantId || o.items.length === 0) throw new Error('El carrito está vacío');
    if (!o.payment) throw new Error('Falta el método de pago');
    if (!o.deliveryAddress?.trim()) throw new Error('Falta la dirección de entrega');
    return Object.freeze({ ...o });
  }
}
