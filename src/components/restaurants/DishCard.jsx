import TagList from '../ui/TagList';

const money = (n) => `S/ ${Number(n).toFixed(2)}`;

export default function DishCard({ dish }) {
  return (
    <article className="card card--dish">
      <div className="card__cover card__cover--sm" aria-hidden="true">{dish.emoji}</div>
      <div className="card__body">
        <h3>{dish.name}</h3>
        {dish.description && <p className="muted">{dish.description}</p>}
        <p className="muted">{dish.calories != null && `${dish.calories} kcal · `}<strong>{money(dish.price)}</strong></p>
        <TagList tags={dish.tags} />
      </div>
    </article>
  );
}
