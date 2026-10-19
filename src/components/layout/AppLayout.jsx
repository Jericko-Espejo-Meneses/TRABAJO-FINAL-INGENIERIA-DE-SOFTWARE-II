import { Link, NavLink, Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="app">
      <header className="navbar">
        <Link to="/home" className="navbar__brand">HealthExpress</Link>

        <nav className="navbar__links" aria-label="Navegación principal">
          <NavLink to="/home">Inicio</NavLink>
        </nav>

        <NavLink to="/profile" className="navbar__profile">Mi perfil</NavLink>
      </header>

      <main className="container"><Outlet /></main>
    </div>
  );
}
