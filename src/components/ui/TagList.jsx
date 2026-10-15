import { tagLabel } from '../../domain/dishTags';

export default function TagList({ tags = [], highlight = [] }) {
  return (
    <div className="tags">
      {tags.map((t) => <span key={t} className={`tag ${highlight.includes(t) ? 'tag--match' : ''}`}>{tagLabel(t)}</span>)}
    </div>
  );
}
