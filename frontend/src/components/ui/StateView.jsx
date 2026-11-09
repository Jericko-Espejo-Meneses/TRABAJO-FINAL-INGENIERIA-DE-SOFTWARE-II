// Muestra carga / error / vacío y delega el contenido al hijo cuando hay datos.
export default function StateView({ loading, error, empty, emptyText = 'Sin resultados', children }) {
  if (loading) return <div className="state"><div className="spinner" aria-label="Cargando" /></div>;
  if (error) return <div className="state state--error">⚠️ {error.message ?? 'Ocurrió un error'}</div>;
  if (empty) return <div className="state">{emptyText}</div>;
  return children;
}
