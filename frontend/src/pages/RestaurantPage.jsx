import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DishCard from '../components/restaurants/DishCard';
import Chip from '../components/ui/Chip';
import StateView from '../components/ui/StateView';
import { useServices } from '../context/ServicesContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { useAsync } from '../hooks/useAsync';
import { useGeolocation } from '../hooks/useGeolocation';
import ImageCover from '../components/ui/ImageCover';

const TABS = ['Información', 'Menú'];

export default function RestaurantPage() {
  const { id } = useParams();
  const { restaurants } = useServices();
  const coords = useGeolocation();
  const addToCart = useAddToCart();
  const [tab, setTab] = useState('Información');
  const { data, loading, error } = useAsync(() => restaurants.getById(id, coords), [id, coords.lat, coords.lng]);

  return (
    <StateView loading={loading} error={error}>
      {data && (
        <>
          <Link to="/home" className="link">← Volver al inicio</Link>
          <div className="hero-card">
            <ImageCover className="hero-card__cover" src={data.restaurant.imageUrl} alt={`Imagen de ${data.restaurant.name}`} fallback={data.restaurant.emoji} />
            <h1>{data.restaurant.name}</h1>
            <p className="muted">⭐ {data.restaurant.rating} · {data.restaurant.foodType}</p>
          </div>
          <div className="chips">{TABS.map((t) => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}</div>
          {tab === 'Información' && (
            <div className="card card__body">
              <p><b>Dirección: </b>{data.restaurant.address}</p>
              <p><b>Tipo de comida: </b>{data.restaurant.foodType}</p>
              {data.restaurant.distanceKm != null && <p><b>Se encuentra a: </b>{data.restaurant.distanceKm} km de ti</p>}
            </div>
          )}
          {tab === 'Menú' && <div className="grid">{data.menu.map((d) => <DishCard key={d.id} dish={d} onAdd={(dish) => addToCart(dish, data.restaurant)} />)}</div>}
        </>
      )}
    </StateView>
  );
}
