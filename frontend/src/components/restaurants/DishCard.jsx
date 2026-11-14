import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import TagList from '../ui/TagList';
import { formatMoney } from '../../utils/format';
import ImageCover from '../ui/ImageCover';

export default function DishCard({ dish, onAdd, showRestaurant }) {
  const available = dish.isAvailable !== false && dish.stock !== 0;
  return (
    <article className="card card--dish">
      <ImageCover className="card__cover card__cover--sm" src={dish.imageUrl} alt={`Imagen de ${dish.name}`} fallback={dish.emoji} />
      <div className="card__body">
        <h3>{dish.name}</h3>
        {showRestaurant && <Link className="muted link" to={`/restaurants/${dish.restaurantId}`}>{dish.restaurantName}</Link>}
        {dish.description && <p className="muted">{dish.description}</p>}
        <p className="muted">{dish.calories != null && `${dish.calories} kcal · `}<strong>{formatMoney(dish.price)}</strong></p>
        <TagList tags={dish.tags} highlight={dish.matchedTags} />
        <Button disabled={!available} onClick={() => onAdd(dish)}>{available ? 'Agregar al carrito' : 'No disponible'}</Button>
      </div>
    </article>
  );
}
