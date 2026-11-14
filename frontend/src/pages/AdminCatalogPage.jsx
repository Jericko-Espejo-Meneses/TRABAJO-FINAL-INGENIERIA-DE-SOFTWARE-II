import { useEffect, useState } from 'react';
import { useServices } from '../context/ServicesContext';
import { Link } from 'react-router-dom';

export default function AdminCatalogPage() {
  const { catalogAdmin } = useServices();
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [canRegister, setCanRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!catalogAdmin) {
        if (active) setMessage('La gestión del catálogo requiere conexión con la API.');
        return;
      }
      const access = await catalogAdmin.get('/admin/catalog/access');
      const users = access.canRegister ? await catalogAdmin.get('/admin/catalog/accounts') : [];
      if (!active) return;
      setCanRegister(access.canRegister);
      setAccounts(users);
      setOptions(access.restaurants);
      setSelected(access.restaurants[0]?.id || '');
      if (!access.canRegister && !access.restaurants.length) setMessage('Tu cuenta no tiene restaurantes asignados.');

    }
    load().catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [catalogAdmin]);

  async function save(event, kind) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMessage('');
    try {
      if (kind === 'restaurant') {
        const created = await catalogAdmin.post('/admin/catalog/restaurants', {
          ...data, latitude: Number(data.latitude), longitude: Number(data.longitude),
        });
        const access = await catalogAdmin.get('/admin/catalog/access');
        setOptions(access.restaurants);
        setSelected(access.restaurants[0]?.id || '');
        setMessage('Restaurante registrado: ' + created.name);
      } else {
        const created = await catalogAdmin.post('/admin/catalog/restaurants/' + encodeURIComponent(selected) + '/dishes', {
          ...data, stock: Number(data.stock), price: Number(data.price), isAvailable: data.isAvailable === 'on',
        });
        setMessage('Plato registrado: ' + created.name);
      }
      form.reset();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <section><h1>{canRegister ? 'Administración del catálogo' : 'Mi restaurante'}</h1>
    <p role="status">{message}</p>
    {canRegister &&
      <form className="card card__body" onSubmit={event => save(event, 'restaurant')}>
        <h2>Registrar restaurante</h2>
        <label>Nombre <input name="name" required maxLength="120" /></label>
        <label>Cuenta responsable <select name="ownerId" required defaultValue="">
          <option value="">Selecciona una cuenta registrada</option>
          {accounts.map(account => <option key={account.id} value={account.id}>{account.fullName} ({account.email})</option>)}
        </select></label>
        <label>Dirección <input name="address" required maxLength="250" /></label>
        <label>Tipo de comida <input name="foodType" required maxLength="80" /></label>
        <label>Latitud <input name="latitude" type="number" min="-90" max="90" step="any" required /></label>
        <label>Longitud <input name="longitude" type="number" min="-180" max="180" step="any" required /></label>
        <button className="btn btn--primary" disabled={busy}>Registrar restaurante</button>
      </form>}
    {options.length > 0 && <>
      <form className="card card__body" onSubmit={event => save(event, 'dish')}>
        <h2>Agregar plato</h2>
        <label>Restaurante <select required value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Selecciona un restaurante</option>
          {options.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select></label>
        <label>Nombre del plato <input name="name" required maxLength="120" /></label>
        <label>Categoría <input name="category" required maxLength="80" /></label>
        <label>Precio (S/) <input name="price" type="number" min="0.01" step="0.01" required /></label>
        <label>Stock <input name="stock" type="number" min="0" max="2147483647" step="1" required /></label>
        <label><input type="checkbox" name="isAvailable" defaultChecked /> Disponible</label>
        <button className="btn btn--primary" disabled={busy || !selected}>Agregar plato</button>
      </form>
      {selected && <Link to={'/restaurants/' + selected}>Ver restaurante en el catálogo</Link>}
    </>}
  </section>;
}
