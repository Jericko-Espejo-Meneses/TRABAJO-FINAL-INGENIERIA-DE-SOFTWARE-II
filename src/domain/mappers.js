// PATRÓN ADAPTER (datos): traduce los DTO del backend (nombres del diagrama de
// clases: idUsuario, correo, idProducto...) al modelo interno de la UI y viceversa.
// Si el backend cambia nombres, solo se toca este archivo.
export const toUser = (d) => ({
  id: d.idUsuario ?? d.id,
  name: d.nombre ?? d.name,
  email: d.correo ?? d.email,
  address: d.direccion ?? d.address ?? '',
  phone: d.telefono ?? d.phone ?? '',
  bio: d.biografia ?? d.bio ?? '',
  preferences: d.preferencias ?? d.preferences ?? [],
});

export const toDish = (d) => ({
  id: d.idProducto ?? d.id,
  name: d.nombre ?? d.name,
  description: d.descripcion ?? d.description ?? '',
  price: Number(d.precio ?? d.price),
  category: d.categoria ?? d.category ?? '',
  stock: d.stock ?? null,
  calories: d.calorias ?? d.calories ?? null,
  tags: d.etiquetas ?? d.tags ?? [],
  emoji: d.emoji ?? '🥗',
  imageUrl: d.imagenUrl ?? d.imageUrl ?? null,
  restaurantId: d.idRestaurante ?? d.restaurantId,
  restaurantName: d.nombreRestaurante ?? d.restaurantName,
  matchedTags: d.coincidencias ?? d.matchedTags ?? [],
});

export const toRestaurant = (d) => ({
  id: d.idRestaurante ?? d.id,
  name: d.nombre ?? d.name,
  address: d.ubicacion ?? d.address ?? '',
  foodType: d.tipoComida ?? d.foodType ?? '',
  rating: d.rating ?? d.calificacion ?? 0,
  distanceKm: d.distanciaKm ?? d.distanceKm ?? null,
  priceLevel: d.nivelPrecio ?? d.priceLevel ?? 2,
  tags: d.etiquetas ?? d.tags ?? [],
  emoji: d.emoji ?? '🍽️',
  imageUrl: d.imagenUrl ?? d.imageUrl ?? null,
});

export const toOrder = (d) => ({
  id: d.idPedido ?? d.id,
  restaurantName: d.restaurante ?? d.restaurantName,
  createdAt: d.fecha ?? d.createdAt,
  subtotal: Number(d.subtotal),
  donation: Number(d.montoDonacion ?? d.donation ?? 0),
  total: Number(d.total),
  status: d.estado ?? d.status ?? 'confirmed',
  paymentMethod: d.pago?.metodoPago ?? d.paymentMethod,
  items: (d.productos ?? d.items ?? []).map((i) => ({
    name: i.nombre ?? i.name,
    quantity: i.cantidad ?? i.quantity,
    unitPrice: Number(i.precio ?? i.unitPrice),
  })),
});

export const toOrderDto = (o) => ({
  idRestaurante: o.restaurantId,
  productos: o.items.map((i) => ({ idProducto: i.dishId, cantidad: i.quantity })),
  subtotal: o.subtotal,
  porcentajeDonacion: o.donationPercentage,
  montoDonacion: o.donationAmount,
  total: o.total,
  pago: { metodoPago: o.payment.method, ...o.payment.details },
  direccionEntrega: o.deliveryAddress,
});
