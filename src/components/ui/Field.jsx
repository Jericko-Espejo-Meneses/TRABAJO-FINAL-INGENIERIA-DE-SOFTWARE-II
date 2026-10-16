export default function Field({ label, icon, error, hint, multiline = false, ...controlProps }) {
  const Control = multiline ? 'textarea' : 'input';
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className={`field__box ${error ? 'field__box--error' : ''}`}>
        {icon && <span aria-hidden="true">{icon}</span>}
        <Control {...controlProps} />
      </span>
      {hint && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
