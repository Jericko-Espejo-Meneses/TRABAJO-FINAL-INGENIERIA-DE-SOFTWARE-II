export default function Chip({ active, children, ...props }) {
  return <button type="button" className={`chip ${active ? 'chip--active' : ''}`} aria-pressed={!!active} {...props}>{children}</button>;
}
