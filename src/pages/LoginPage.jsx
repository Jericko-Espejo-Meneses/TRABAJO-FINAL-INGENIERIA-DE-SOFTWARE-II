import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validators';


export default function LoginPage() {
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const goNext = () => navigate(location.state?.from ?? '/home', { replace: true });

  const run = async (action) => {
    setBusy(true); setServerError('');
    try { await action(); goNext(); } catch (e) { setServerError(e.message); } finally { setBusy(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length === 0) run(() => login(values));
  };

  return (
    <div className="auth">
      <section className="auth__hero"><div className="splash__logo"></div><h1>HealthExpress</h1><p>Comida saludable con impacto social</p></section>
      <section className="auth__panel">
        <form onSubmit={submit} noValidate>
          <Field label="Correo" type="email" autoComplete="email" value={values.email} error={errors.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
          <Field label="Contraseña" type="password" autoComplete="current-password" value={values.password} error={errors.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
          {serverError && <p className="alert">{serverError}</p>}
          <Button type="submit" block disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</Button>
        </form>
        <Link to="/register" className="btn btn--secondary btn--block">Crear cuenta</Link>
        <p className="muted small center">Al continuar, aceptas los Términos y Condiciones</p>
      </section>
    </div>
  );
}
