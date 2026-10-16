import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../context/ServicesContext';
import { validateProfile, BIO_MAX } from '../utils/validators';

const pick = (u) => ({ name: u.name ?? '', address: u.address ?? '', bio: u.bio ?? '' });

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { profile } = useServices();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(pick(user));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const startEdit = () => { setValues(pick(user)); setErrors({}); setServerError(''); setMessage(''); setEditing(true); };
  const cancel = () => { setEditing(false); setErrors({}); setServerError(''); };

  const save = async (e) => {
    e.preventDefault();
    const found = validateProfile(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true); setServerError('');
    try {
      const updated = await profile.update({ name: values.name.trim(), address: values.address.trim(), bio: values.bio.trim() });
      updateUser(updated);
      setEditing(false);
      setMessage('Perfil actualizado correctamente ');
    } catch (err) {
      setServerError(err.message);
    } finally { setBusy(false); }
  };

  const bind = (name) => ({ value: values[name], error: errors[name], onChange: (e) => setValues({ ...values, [name]: e.target.value }) });

  return (
    <div className="profile">
      <div className="profile__head">
        <div className="avatar" aria-hidden="true">{(user.name ?? '?').charAt(0).toUpperCase()}</div>
        <div>
          <h1>{user.name}</h1>
          <p className="muted">{user.email}</p>
        </div>
      </div>

      {message && <p className="success">{message}</p>}

      {!editing ? (
        <section className="card card__body profile__data">
          <dl>
            <dt>Nombre completo</dt><dd>{user.name}</dd>
            <dt>Correo</dt><dd>{user.email}</dd>
            <dt>Dirección</dt><dd>{user.address || <span className="muted">Sin dirección registrada</span>}</dd>
            <dt>Biografía</dt><dd>{user.bio || <span className="muted">Aún no escribiste tu biografía</span>}</dd>
          </dl>
          <div className="row">
            <Button onClick={startEdit}> Editar perfil</Button>
            <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Cerrar sesión</Button>
          </div>
        </section>
      ) : (
        <form className="card card__body profile__form" onSubmit={save} noValidate>
          <h2>Editar perfil</h2>
          <Field label="Nombre completo" autoComplete="name" {...bind('name')} />
          <Field label="Dirección" autoComplete="street-address" {...bind('address')} />
          <Field label="Biografía" multiline rows={4} maxLength={BIO_MAX} placeholder="Cuéntanos un poco sobre ti y tus hábitos saludables"
            hint={`${values.bio.length}/${BIO_MAX}`} {...bind('bio')} />
          <p className="muted small">El correo no se puede modificar.</p>
          {serverError && <p className="alert">{serverError}</p>}
          <div className="row">
            <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</Button>
            <Button type="button" variant="secondary" onClick={cancel} disabled={busy}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  );
}
