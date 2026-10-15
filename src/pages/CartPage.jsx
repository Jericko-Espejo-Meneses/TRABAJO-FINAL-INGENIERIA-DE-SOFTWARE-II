import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useCart } from '../cart/CartContext';
import { useServices } from '../context/ServicesContext';
import { formatMoney } from '../utils/format';

export default function CartPage() {
  const cart = useCart();
  const { checkout } = useServices();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return <div className="state">Tu carrito está vacío. <Link to="/home" className="link">Explora restaurantes</Link></div>;
  }
  const summary = checkout.preview(cart);

  return (
    <>
      <h2>Tu carrito · {cart.restaurant.name}</h2>
      <ul className="list">
        {cart.items.map(({ dish, quantity }) => (
          <li key={dish.id} className="list__item">
            <span aria-hidden="true">{dish.emoji}</span>
            <div className="grow"><strong>{dish.name}</strong><div className="muted">{formatMoney(dish.price)}</div></div>
            <div className="qty">
              <button aria-label="Quitar uno" onClick={() => cart.setQuantity(dish.id, quantity - 1)}>−</button>
              <span>{quantity}</span>
              <button aria-label="Agregar uno" onClick={() => cart.setQuantity(dish.id, quantity + 1)}>+</button>
            </div>
            <button className="icon-btn" aria-label={`Eliminar ${dish.name}`} onClick={() => cart.remove(dish.id)}>🗑️</button>
          </li>
        ))}
      </ul>
      <div className="summary">
        <div className="row row--between"><span>Subtotal</span><span>{formatMoney(summary.subtotal)}</span></div>
        <div className="row row--between muted"><span>💚 Donación WFP ({summary.donationPercentage}%) incluida</span><span>{formatMoney(summary.donationAmount)}</span></div>
        <div className="row row--between total"><span>Total</span><span>{formatMoney(summary.total)}</span></div>
      </div>
      <Button block onClick={() => navigate('/checkout')}>Proceder al pago</Button>
    </>
  );
}
