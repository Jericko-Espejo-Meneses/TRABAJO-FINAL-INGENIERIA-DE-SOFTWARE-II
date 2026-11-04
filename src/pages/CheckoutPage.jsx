import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../context/ServicesContext';
import { ValidationError } from '../domain/errors';
import { PaymentStrategyFactory } from '../payments/PaymentStrategyFactory';
import { formatMoney } from '../utils/format';

export default function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const { checkout } = useServices();
  const navigate = useNavigate();
  const methods = PaymentStrategyFactory.list();
  const [methodId, setMethodId] = useState(methods[0].id);
  const [values, setValues] = useState({});
  const [address, setAddress] = useState(user.address ?? '');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (cart.items.length === 0) return <div className="state">No hay productos para pagar. <Link to="/home" className="link">Volver</Link></div>;

  const method = PaymentStrategyFactory.create(methodId);
  const summary = checkout.preview(cart);

  const pay = async () => {
    setBusy(true); setServerError(''); setErrors({});
    try {
      const order = await checkout.placeOrder({ cart, methodId, values, address });
      cart.clear();
      navigate(`/confirmation/${order.id}`, { replace: true, state: { order } });
    } catch (e) {
      if (e instanceof ValidationError) setErrors(e.errors); else setServerError(e.message);
    } finally { setBusy(false); }
  };

  return (
    <>
      <h2>Método de pago</h2>
      <Field label="Dirección de entrega"  value={address} onChange={(e) => setAddress(e.target.value)} />
      <div className="methods">
        {methods.map((m) => (
          <button key={m.id} type="button" className={`method ${m.id === methodId ? 'method--active' : ''}`} onClick={() => { setMethodId(m.id); setValues({}); setErrors({}); }}>
            <span aria-hidden="true">{m.icon}</span> {m.label}
          </button>
        ))}
      </div>
      {method.fields.map((f) => (
        <Field key={`${methodId}-${f.name}`} label={f.label} placeholder={f.placeholder} type={f.type ?? 'text'} inputMode={f.inputMode}
          value={values[f.name] ?? ''} error={errors[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
      ))}
      <div className="summary">
        <div className="row row--between"><span>Total a pagar</span><strong>{formatMoney(summary.total)}</strong></div>
        <div className="donation">Donación al World Food Programme: {formatMoney(summary.donationAmount)} ({summary.donationPercentage}% de tu pago) — se descuenta automáticamente.</div>
      </div>
      {serverError && <p className="alert">{serverError}</p>}
      <Button block onClick={pay} disabled={busy}>{busy ? 'Procesando pago…' : 'Confirmar pago'}</Button>
    </>
  );
}
