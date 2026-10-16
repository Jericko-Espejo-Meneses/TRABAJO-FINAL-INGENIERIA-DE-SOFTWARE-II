import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { validateRegister } from '../utils/validators';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', address: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (name) => ({ value: values[name], error: errors[name], onChange: (e) => setValues({ ...values, [name]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    const found = validateRegister(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true); setServerError('');
    try {
      await register({ name: values.name.trim(), email: values.email, password: values.password, address: values.address });
      navigate('/home', { replace: true });
    } catch (err) { setServerError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth auth--single">
      <section className="auth__panel">
        <h2>Crear cuenta</h2>
        <form onSubmit={submit} noValidate>
          <Field label="Nombre completo" icon="👤" autoComplete="name" {...bind('name')} />
          <Field label="Correo" type="email" autoComplete="email" {...bind('email')} />
          <Field label="Contraseña" type="password" autoComplete="new-password" {...bind('password')} />
          <Field label="Confirmar contraseña" type="password" autoComplete="new-password" {...bind('confirm')} />
          <Field label="Dirección (opcional)" autoComplete="street-address" {...bind('address')} />
          {serverError && <p className="alert">{serverError}</p>}
          <Button type="submit" block disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</Button>
        </form>
        <p className="center">¿Ya tienes una cuenta? <Link to="/login" className="link">Inicia sesión</Link></p>
      </section>
    </div>
  );
}
