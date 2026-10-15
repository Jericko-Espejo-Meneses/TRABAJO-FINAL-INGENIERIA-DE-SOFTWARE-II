import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../cart/CartContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { formatMoney } from '../../utils/format';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { itemCount, subtotal } = useCart();
  const { label } = useGeolocation();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" title={`${user.name} · Cerrar sesión`} onClick={() => { logout(); navigate('/login'); }}>👤</button>
        <Link to="/home" className="topbar__loc">📍 {label}</Link>
        <button className="icon-btn" title="Notificaciones (próximamente)" disabled>🔔</button>
      </header>
      <nav className="nav">
        <NavLink to="/home">Inicio</NavLink>
        <NavLink to="/recommendations">Para ti</NavLink>
        <NavLink to="/orders">Mis pedidos</NavLink>
      </nav>
      <main className="container"><Outlet /></main>
      {itemCount > 0 && (
        <Link to="/cart" className="cartbar">🛒 {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'} · {formatMoney(subtotal)} <span>Ver carrito →</span></Link>
      )}
    </div>
  );
}
