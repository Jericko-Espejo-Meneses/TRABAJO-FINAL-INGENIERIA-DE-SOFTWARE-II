import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../../cart/CartContext';
import { formatMoney } from '../../utils/format';

export default function AppLayout() {
  const { itemCount, subtotal } = useCart();

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/home" className="navbar__brand">HealthExpress</Link>

        <nav className="navbar__links" aria-label="Navegación principal">
          <NavLink to="/home">Inicio</NavLink>
          <NavLink to="/recommendations">Para ti</NavLink>
          <NavLink to="/orders">Mis pedidos</NavLink>
          <button type="button" className="navbar__bell" data-tip="Próximamente" aria-label="Notificaciones (próximamente)">🔔</button>
        </nav>

        <NavLink to="/profile" className="navbar__profile">Mi perfil</NavLink>
      </header>

      <main className="container"><Outlet /></main>

      {itemCount > 0 && (
        <Link to="/cart" className="cartbar">🛒 {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'} · {formatMoney(subtotal)} <span>Ver carrito →</span></Link>
      )}
    </div>
  );
}
