import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SplashPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return undefined;
    const t = setTimeout(() => navigate(user ? '/home' : '/login', { replace: true }), 1800);
    return () => clearTimeout(t);
  }, [loading, user, navigate]);

  return (
    <div className="splash">
      <div className="splash__logo">💚🍽️</div>
      <h1>HealthExpress</h1>
      <p>Comida saludable con impacto social</p>
      <div className="spinner" aria-label="Cargando" />
    </div>
  );
}
