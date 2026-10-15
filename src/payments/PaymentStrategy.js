// PATRÓN STRATEGY: cada método de pago define sus campos, su validación y el
// payload que se enviará al backend. El checkout no conoce los detalles de ninguno.
export class PaymentStrategy {
  constructor({ id, label, icon, fields }) {
    Object.assign(this, { id, label, icon, fields });
  }
  validate() { return {}; }
  toPayload(values) { return { method: this.id, details: values }; }
}

export const check = (errors, name, ok, message) => { if (!ok) errors[name] = message; };
