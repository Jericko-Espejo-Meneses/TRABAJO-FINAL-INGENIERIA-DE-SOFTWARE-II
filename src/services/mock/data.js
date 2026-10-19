const dish = (id, name, calories, price, tags, emoji, description) => ({
  id, name, calories, price, tags, emoji, description, category: 'Plato', stock: 50,
});

const raw = [
  { id: 'r1', name: 'Green Bowl', foodType: 'Ensaladas', distanceKm: 0.8, priceLevel: 2, rating: 4.7, emoji: '🥗', address: 'Av. Larco 410, Miraflores',
    menu: [
      dish('d1', 'Bowl Quinoa Power', 420, 28, ['high-protein', 'low-fat'], '🥣', 'Quinoa, pollo, palta y vegetales'),
      dish('d2', 'Ensalada Mediterránea', 310, 24, ['low-calorie', 'vegan'], '🥗', 'Tomate, pepino, aceituna y garbanzos'),
      dish('d3', 'Smoothie Verde', 180, 14, ['low-calorie', 'vegan'], '🥤', 'Espinaca, piña y jengibre'),
    ] },
  { id: 'r2', name: 'Vegana Lima', foodType: 'Vegana', distanceKm: 1.5, priceLevel: 2, rating: 4.6, emoji: '🌱', address: 'Calle Berlín 220, Miraflores',
    menu: [
      dish('d4', 'Hamburguesa de lentejas', 480, 26, ['vegan', 'high-protein'], '🍔', 'Pan integral y salsa de palta'),
      dish('d5', 'Curry de garbanzos', 450, 25, ['vegan'], '🍛', 'Con arroz integral'),
      dish('d6', 'Wrap de hummus', 350, 20, ['vegan', 'low-calorie'], '🌯', 'Hummus, zanahoria y rúcula'),
    ] },
  { id: 'r3', name: 'Fit Kitchen', foodType: 'Fit', distanceKm: 2.4, priceLevel: 3, rating: 4.8, emoji: '💪', address: 'Av. Benavides 1500, Surco',
    menu: [
      dish('d7', 'Pechuga a la plancha con camote', 520, 34, ['high-protein', 'low-fat'], '🍗', 'Con ensalada fresca'),
      dish('d8', 'Salmón con vegetales', 560, 42, ['high-protein'], '🐟', 'Salmón al horno y brócoli'),
      dish('d9', 'Tortilla de claras', 240, 18, ['low-calorie', 'high-protein'], '🍳', 'Espinaca y champiñones'),
    ] },
  { id: 'r4', name: 'Nativo Saludable', foodType: 'Peruana', distanceKm: 3.2, priceLevel: 1, rating: 4.4, emoji: '🇵🇪', address: 'Jr. Cuzco 305, Barranco',
    menu: [
      dish('d10', 'Ceviche light', 280, 22, ['low-calorie', 'high-protein', 'low-fat'], '🐠', 'Pescado fresco, sin fritos'),
      dish('d11', 'Quinotto de quinua', 410, 19, ['vegan'], '🍚', 'Quinua cremosa con hongos'),
      dish('d12', 'Causa de atún light', 330, 17, ['low-fat'], '🥔', 'Papa amarilla y atún'),
    ] },
  { id: 'r5', name: 'Sushi Fresh', foodType: 'Japonesa', distanceKm: 1.9, priceLevel: 3, rating: 4.5, emoji: '🍣', address: 'Av. Pardo 650, Miraflores',
    menu: [
      dish('d13', 'Sashimi mixto', 300, 38, ['high-protein', 'low-fat', 'low-calorie'], '🍣', 'Salmón, atún y pesca del día'),
      dish('d14', 'Roll vegano', 320, 21, ['vegan'], '🍙', 'Palta, pepino y zanahoria'),
      dish('d15', 'Ensalada wakame', 150, 15, ['low-calorie', 'vegan'], '🥬', 'Alga wakame y sésamo'),
    ] },
  { id: 'r6', name: 'Económico Verde', foodType: 'Menú', distanceKm: 0.5, priceLevel: 1, rating: 4.2, emoji: '🍲', address: 'Av. Arequipa 4100, Miraflores',
    menu: [
      dish('d16', 'Menú del día fit', 500, 12, ['high-protein'], '🍱', 'Entrada, fondo y refresco'),
      dish('d17', 'Sopa de verduras', 160, 8, ['low-calorie', 'vegan', 'low-fat'], '🍜', 'Caldo casero de verduras'),
      dish('d18', 'Arroz integral con pollo', 480, 13, ['low-fat'], '🍚', 'Porción balanceada'),
    ] },
];

export const restaurants = raw.map((r) => ({
  ...r,
  tags: [...new Set(r.menu.flatMap((d) => d.tags))],
  menu: r.menu.map((d) => ({ ...d, restaurantId: r.id, restaurantName: r.name })),
}));
