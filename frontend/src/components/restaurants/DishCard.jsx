import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import TagList from '../ui/TagList';
import { formatMoney } from '../../utils/format';

export default function DishCard({ dish, onAdd, showRestaurant }) {
  return (
    <article className="card card--dish">
      <div className="card__cover card__cover--sm" aria-hidden="true">{dish.emoji}</div>
      <div className="card__body">
        <h3>{dish.name}</h3>
        {showRestaurant && <Link className="muted link" to={`/restaurants/${dish.restaurantId}`}>{dish.restaurantName}</Link>}
        {dish.description && <p className="muted">{dish.description}</p>}
        <p className="muted">{dish.calories != null && `${dish.calories} kcal · `}<strong>{formatMoney(dish.price)}</strong></p>
        <TagList tags={dish.tags} highlight={dish.matchedTags} />
        <Button onClick={() => onAdd(dish)}>Agregar al carrito</Button>
      </div>
    </article>
  );
}
