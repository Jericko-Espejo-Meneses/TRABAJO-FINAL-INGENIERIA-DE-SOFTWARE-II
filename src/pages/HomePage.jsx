import { useState } from 'react';
import FilterBar from '../components/restaurants/FilterBar';
import RestaurantCard from '../components/restaurants/RestaurantCard';
import StateView from '../components/ui/StateView';
import { useServices } from '../context/ServicesContext';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { useGeolocation } from '../hooks/useGeolocation';

export default function HomePage() {
  const { restaurants } = useServices();
  const coords = useGeolocation();
  const [criteria, setCriteria] = useState({ query: '', tags: [], foodType: '', maxDistanceKm: null });
  const debouncedQuery = useDebounce(criteria.query);
  const { data, loading, error } = useAsync(
    () => restaurants.search({ ...criteria, query: debouncedQuery }, coords),
    [debouncedQuery, criteria.tags, criteria.foodType, criteria.maxDistanceKm, coords.lat, coords.lng],
  );

  return (  
    <>
      <div className="search">
        <input type="search" placeholder="Busca restaurantes o platos saludables" value={criteria.query} onChange={(e) => setCriteria({ ...criteria, query: e.target.value })} />
      </div>
      <FilterBar criteria={criteria} onChange={setCriteria} />
      <h2>Restaurantes saludables cerca de ti</h2>
      <StateView loading={loading} error={error} empty={data?.length === 0} emptyText="No encontramos restaurantes con esos filtros.">
        <div className="grid">{data?.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}</div>
      </StateView>
    </>
  );
}
