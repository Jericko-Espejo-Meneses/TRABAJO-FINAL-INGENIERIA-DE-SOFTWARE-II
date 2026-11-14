import { useAsync } from '../../hooks/useAsync';
import { useServices } from '../../context/ServicesContext';
import { useAuth } from '../../context/AuthContext';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../../cart/CartContext';
import { formatMoney } from '../../utils/format';

export default function AppLayout() {
  const { catalogAdmin } = useServices();
  const { user } = useAuth();
  const { data: access } = useAsync(async () => catalogAdmin?.get('/admin/catalog/access'), [catalogAdmin, user?.id]);
  const { itemCount, subtotal } = useCart();

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/home" className="navbar__brand">HealthExpress</Link>

        <nav className="navbar__links" aria-label="Navegación principal">
          <NavLink to="/home">Inicio</NavLink>
          <NavLink to="/recommendations">Para ti</NavLink>
          {(access?.canRegister || access?.restaurants?.length > 0) && <NavLink to="/admin/catalogo">{access.canRegister ? 'Administrar catálogo' : 'Mi restaurante'}</NavLink>}
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
