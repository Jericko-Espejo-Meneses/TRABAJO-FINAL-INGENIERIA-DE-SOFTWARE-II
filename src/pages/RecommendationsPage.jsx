import { useEffect, useState } from 'react';
import DishCard from '../components/restaurants/DishCard';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import StateView from '../components/ui/StateView';
import { NUTRITION_TAGS } from '../domain/dishTags';
import { useServices } from '../context/ServicesContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { useAsync } from '../hooks/useAsync';

export default function RecommendationsPage() {
  const { recommendations } = useServices();
  const addToCart = useAddToCart();
  const [version, setVersion] = useState(0);
  const [prefs, setPrefs] = useState([]);
  const [saving, setSaving] = useState(false);
  const saved = useAsync(() => recommendations.getPreferences(), []);
  const list = useAsync(() => recommendations.getRecommendations(), [version]);

  useEffect(() => { if (saved.data) setPrefs(saved.data); }, [saved.data]);

  const toggle = (id) => setPrefs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const save = async () => {
    setSaving(true);
    try { await recommendations.savePreferences(prefs); setVersion((v) => v + 1); } finally { setSaving(false); }
  };

  return (
    <>
      <h2>Tus preferencias nutricionales, según tus hábitos</h2>
      <div className="chips">{NUTRITION_TAGS.map((t) => <Chip key={t.id} active={prefs.includes(t.id)} onClick={() => toggle(t.id)}>{t.label}</Chip>)}</div>
      <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar y actualizar'}</Button>
      <h2>Platos recomendados</h2>
      <StateView loading={list.loading} error={list.error} empty={list.data?.length === 0} emptyText="Aún no tenemos recomendaciones. Elige tus preferencias.">
        <div className="grid">
          {list.data?.map((d) => (
            <DishCard key={d.id} dish={d} showRestaurant onAdd={(dish) => addToCart(dish, { id: dish.restaurantId, name: dish.restaurantName })} />
          ))}
        </div>
      </StateView>
    </>
  );
}
