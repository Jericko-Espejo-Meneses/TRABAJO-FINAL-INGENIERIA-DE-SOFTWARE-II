import { ValidationError } from '../domain/errors';
import { calculateDonation } from '../domain/donation';
import { PaymentStrategyFactory } from '../payments/PaymentStrategyFactory';
import { OrderBuilder } from './OrderBuilder';

// PATRÓN FACADE: la pantalla de pago llama a UN método y la fachada coordina
// estrategia de pago + validación + builder + servicio de pedidos.
export class CheckoutFacade {
  constructor({ orders, donationPercentage, strategies = PaymentStrategyFactory }) {
    this.orders = orders;
    this.donationPercentage = donationPercentage;
    this.strategies = strategies;
  }

  preview(cart) {
    return {
      subtotal: cart.subtotal,
      total: cart.subtotal,
      donationPercentage: this.donationPercentage,
      donationAmount: calculateDonation(cart.subtotal, this.donationPercentage),
    };
  }

  async placeOrder({ cart, methodId, values, address }) {
    const strategy = this.strategies.create(methodId);
    const errors = strategy.validate(values);
    if (Object.keys(errors).length > 0) throw new ValidationError(errors);

    const request = new OrderBuilder()
      .fromCart(cart)
      .withDonation(this.donationPercentage)
      .withPayment(strategy.toPayload(values))
      .deliverTo(address)
      .build();

    return this.orders.create(request);
  }
}
