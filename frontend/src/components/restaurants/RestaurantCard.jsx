import { Link } from 'react-router-dom';
import TagList from '../ui/TagList';

export default function RestaurantCard({ restaurant: r }) {
  return (
    <Link to={`/restaurants/${r.id}`} className="card card--link">
      <div className="card__cover" aria-hidden="true">{r.emoji}</div>
      <div className="card__body">
        <div className="row row--between">
          <h3>{r.name}</h3>
          <span className="rating">⭐ {r.rating}</span>
        </div>
        <p className="muted">{r.foodType}{r.distanceKm != null && ` · ${r.distanceKm} km`}</p>
        <TagList tags={r.tags.slice(0, 3)} />
      </div>
    </Link>
  );
}
