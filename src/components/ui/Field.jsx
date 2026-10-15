export default function Field({ label, icon, error, ...inputProps }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className={`field__box ${error ? 'field__box--error' : ''}`}>
        {icon && <span aria-hidden="true">{icon}</span>}
        <input {...inputProps} />
      </span>
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
