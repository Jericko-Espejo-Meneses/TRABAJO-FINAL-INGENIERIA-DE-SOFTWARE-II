export default function Button({ variant = 'primary', block, className = '', ...props }) {
  return <button className={`btn btn--${variant} ${block ? 'btn--block' : ''} ${className}`} {...props} />;
}
