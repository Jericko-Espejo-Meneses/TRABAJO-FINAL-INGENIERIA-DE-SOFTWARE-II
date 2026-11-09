import Chip from '../ui/Chip';
import { RESTAURANT_FILTERS } from '../../domain/restaurantFilters';
import { FOOD_TYPES } from '../../domain/dishTags';

// Los chips salen del registro de filtros: no hay que tocar este componente para agregar uno.
export default function FilterBar({ criteria, onChange }) {
  const toggle = (id) => {
    const tags = criteria.tags.includes(id) ? criteria.tags.filter((t) => t !== id) : [...criteria.tags, id];
    onChange({ ...criteria, tags });
  };
  return (
    <div className="filters">
      <div className="chips">
        {RESTAURANT_FILTERS.map((f) => <Chip key={f.id} active={criteria.tags.includes(f.id)} onClick={() => toggle(f.id)}>{f.label}</Chip>)}
      </div>
      <div className="row filters__extra">
        <label>Tipo de comida
          <select value={criteria.foodType} onChange={(e) => onChange({ ...criteria, foodType: e.target.value })}>
            <option value="">Todos</option>
            {FOOD_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Distancia máx.
          <select value={criteria.maxDistanceKm ?? ''} onChange={(e) => onChange({ ...criteria, maxDistanceKm: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Sin límite</option>
            <option value="1">1 km</option><option value="2">2 km</option><option value="3">3 km</option>
          </select>
        </label>
      </div>
    </div>
  );
}
