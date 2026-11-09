export const NUTRITION_TAGS = [
  { id: 'low-calorie', label: 'Bajo en calorías' },
  { id: 'vegan', label: 'Vegano' },
  { id: 'high-protein', label: 'Alto en proteína' },
  { id: 'low-fat', label: 'Bajo en grasa' },
];

export const FOOD_TYPES = ['Ensaladas', 'Vegana', 'Fit', 'Peruana', 'Japonesa', 'Menú'];

export const tagLabel = (id) => NUTRITION_TAGS.find((t) => t.id === id)?.label ?? id;
