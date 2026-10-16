import { CardPayment, PayPalPayment, WalletPayment } from './strategies';

// PATRÓN FACTORY (registro): crea/entrega la estrategia según el id.
// Para un método nuevo: crear la clase y registrarla aquí (Open/Closed).
const registry = new Map();

export const PaymentStrategyFactory = {
  register(strategy) { registry.set(strategy.id, strategy); return this; },
  create(id) {
    const strategy = registry.get(id);
    if (!strategy) throw new Error(`Método de pago no soportado: ${id}`);
    return strategy;
  },
  list() { return [...registry.values()]; },
};

PaymentStrategyFactory
  .register(new CardPayment())
  .register(new WalletPayment('yape', 'Yape', '📱'))
  .register(new WalletPayment('plin', 'Plin', '📲'))
  .register(new PayPalPayment());
