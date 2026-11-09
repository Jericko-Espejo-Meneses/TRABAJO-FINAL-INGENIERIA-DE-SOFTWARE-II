import { PaymentStrategy, check } from './PaymentStrategy';

export class CardPayment extends PaymentStrategy {
  constructor() {
    super({
      id: 'card', label: 'Tarjeta Visa / Mastercard', icon: '💳',
      fields: [
        { name: 'holder', label: 'Titular', placeholder: 'Como aparece en la tarjeta' },
        { name: 'number', label: 'Número de tarjeta', placeholder: '4111 1111 1111 1111', inputMode: 'numeric' },
        { name: 'expiry', label: 'Vencimiento (MM/AA)', placeholder: '08/28' },
        { name: 'cvv', label: 'CVV', placeholder: '123', type: 'password', inputMode: 'numeric' },
      ],
    });
  }
  validate(v) {
    const e = {};
    check(e, 'holder', v.holder?.trim(), 'Ingresa el titular');
    check(e, 'number', /^\d{13,19}$/.test((v.number ?? '').replace(/\s/g, '')), 'Número de tarjeta no válido');
    check(e, 'expiry', /^(0[1-9]|1[0-2])\/\d{2}$/.test(v.expiry ?? ''), 'Formato MM/AA');
    check(e, 'cvv', /^\d{3,4}$/.test(v.cvv ?? ''), 'CVV no válido');
    return e;
  }
  // Nunca se envía el número completo: en producción la pasarela entrega un token.
  toPayload(v) {
    return { method: this.id, details: { ultimos4: v.number.replace(/\s/g, '').slice(-4), titular: v.holder, token: null } };
  }
}

export class WalletPayment extends PaymentStrategy {
  constructor(id, label, icon) {
    super({
      id, label, icon,
      fields: [
        { name: 'phone', label: 'Celular', placeholder: '987654321', inputMode: 'numeric' },
        { name: 'code', label: 'Código de aprobación (6 dígitos)', placeholder: '123456', inputMode: 'numeric' },
      ],
    });
  }
  validate(v) {
    const e = {};
    check(e, 'phone', /^9\d{8}$/.test(v.phone ?? ''), 'Celular de 9 dígitos que empiece con 9');
    check(e, 'code', /^\d{6}$/.test(v.code ?? ''), 'Código de 6 dígitos');
    return e;
  }
  toPayload(v) { return { method: this.id, details: { celular: v.phone, codigo: v.code } }; }
}

export class PayPalPayment extends PaymentStrategy {
  constructor() {
    super({ id: 'paypal', label: 'PayPal', icon: '🅿️', fields: [{ name: 'email', label: 'Correo de PayPal', placeholder: 'tu@correo.com', type: 'email' }] });
  }
  validate(v) {
    const e = {};
    check(e, 'email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email ?? ''), 'Correo no válido');
    return e;
  }
  toPayload(v) { return { method: this.id, details: { correo: v.email } }; }
}
