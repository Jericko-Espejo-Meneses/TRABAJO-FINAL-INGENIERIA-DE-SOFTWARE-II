// PATRÓN STRATEGY (registro de filtros): cada filtro es una estrategia con su
// propia regla. Para agregar un filtro nuevo solo se añade una entrada (OCP);
// la UI y el mock lo toman automáticamente.
export const RESTAURANT_FILTERS = [
  { id: 'low-calorie', label: 'Bajo en calorías', matches: (r) => r.tags.includes('low-calorie') },
  { id: 'vegan', label: 'Vegano', matches: (r) => r.tags.includes('vegan') },
  { id: 'high-protein', label: 'Alto en proteína', matches: (r) => r.tags.includes('high-protein') },
  { id: 'nearby', label: 'Cerca de mí', matches: (r) => r.distanceKm <= 2 },
  { id: 'cheap', label: 'Económico', matches: (r) => r.priceLevel === 1 },
];

export const matchesFilter = (id, restaurant) =>
  RESTAURANT_FILTERS.find((f) => f.id === id)?.matches(restaurant) ?? true;
