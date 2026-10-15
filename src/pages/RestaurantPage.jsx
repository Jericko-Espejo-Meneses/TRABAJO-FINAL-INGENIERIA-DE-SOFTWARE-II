import { useState } from 'react';
import { useParams } from 'react-router-dom';
import DishCard from '../components/restaurants/DishCard';
import Chip from '../components/ui/Chip';
import StateView from '../components/ui/StateView';
import { useServices } from '../context/ServicesContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { useAsync } from '../hooks/useAsync';

const TABS = ['Información', 'Menú', 'Reseñas'];

export default function RestaurantPage() {
  const { id } = useParams();
  const { restaurants } = useServices();
  const addToCart = useAddToCart();
  const [tab, setTab] = useState('Menú');
  const { data, loading, error } = useAsync(() => restaurants.getById(id), [id]);

  return (
    <StateView loading={loading} error={error}>
      {data && (
        <>
          <div className="hero-card">
            <div className="hero-card__cover" aria-hidden="true">{data.restaurant.emoji}</div>
            <h1>{data.restaurant.name}</h1>
            <p className="muted">⭐ {data.restaurant.rating} · {data.restaurant.foodType}</p>
          </div>
          <div className="chips">{TABS.map((t) => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}</div>
          {tab === 'Menú' && (
            <div className="grid">{data.menu.map((d) => <DishCard key={d.id} dish={d} onAdd={(dish) => addToCart(dish, data.restaurant)} />)}</div>
          )}
          {tab === 'Información' && (
            <div className="card card__body"><p>📍 {data.restaurant.address}</p><p>🍴 Tipo de comida: {data.restaurant.foodType}</p>{data.restaurant.distanceKm != null && <p>🚴 A {data.restaurant.distanceKm} km de ti</p>}</div>
          )}
          {tab === 'Reseñas' && <div className="state">Las reseñas estarán disponibles próximamente.</div>}
        </>
      )}
    </StateView>
  );
}
