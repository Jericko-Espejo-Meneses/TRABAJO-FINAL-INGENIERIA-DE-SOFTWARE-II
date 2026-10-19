// PATRÓN ADAPTER (datos): traduce los DTO del backend al modelo interno de la UI.
// Si el backend cambia nombres, solo se toca este archivo.
export const toUser = (d) => ({
  id: d.idUsuario ?? d.id,
  name: d.nombre ?? d.name,
  email: d.correo ?? d.email,
  address: d.direccion ?? d.address ?? '',
  bio: d.biografia ?? d.bio ?? '',
});

export const toDish = (d) => ({
  id: d.idProducto ?? d.id,
  name: d.nombre ?? d.name,
  description: d.descripcion ?? d.description ?? '',
  price: Number(d.precio ?? d.price),
  calories: d.calorias ?? d.calories ?? null,
  tags: d.etiquetas ?? d.tags ?? [],
  emoji: d.emoji ?? '🥗',
});

export const toRestaurant = (d) => ({
  id: d.idRestaurante ?? d.id,
  name: d.nombre ?? d.name,
  address: d.ubicacion ?? d.address ?? '',
  foodType: d.tipoComida ?? d.foodType ?? '',
  rating: Number(d.calificacion ?? d.rating ?? 0),
  distanceKm: d.distanciaKm ?? d.distanceKm ?? null,
  priceLevel: d.nivelPrecio ?? d.priceLevel ?? 2,
  tags: d.etiquetas ?? d.tags ?? [],
  emoji: d.emoji ?? '🍽️',
});
