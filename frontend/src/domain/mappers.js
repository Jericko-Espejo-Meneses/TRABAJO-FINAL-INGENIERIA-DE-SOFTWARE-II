// PATRÓN ADAPTER (datos): traduce los DTO del backend (nombres del diagrama de
// clases: idUsuario, correo, idProducto...) al modelo interno de la UI y viceversa.
// Si el backend cambia nombres, solo se toca este archivo.
export const toUser = (d) => ({
  id: d.idUsuario ?? d.id,
  name: d.nombre ?? d.fullName ?? d.name,
  email: d.correo ?? d.email,
  address: d.direccion ?? d.address
    ?? (d.addresses?.find((a) => a.isDefault) ?? d.addresses?.[0])?.street ?? '',
  phone: d.telefono ?? d.phone ?? '',
  bio: d.biografia ?? d.bio ?? '',
  preferences: d.preferencias ?? d.dietaryPreferences ?? d.preferences ?? [],
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
  foodType: d.tipoComida ?? d.foodType ?? d.category ?? '',
  rating: d.rating ?? d.calificacion ?? 0,
  distanceKm: d.distanciaKm ?? d.distanceKm ?? null,
  priceLevel: ({ '$': 1, '$$': 2, '$$$': 3 })[d.nivelPrecio ?? d.priceLevel] ?? d.nivelPrecio ?? d.priceLevel ?? 2,
  tags: d.etiquetas ?? d.tags ?? d.dietaryTags ?? [],
  emoji: d.emoji ?? '🍽️',
  imageUrl: d.imagenUrl ?? d.imageUrl ?? d.bannerUrl ?? d.logoUrl ?? null,
});

export const toOrder = (d) => ({
  id: d.idPedido ?? d.id,
  restaurantName: 
    d.restaurante?.nombre ??
    d.restaurante?.name ??
    d.nombreRestaurante ??
    d.restaurante ??
    d.restaurantName ??
    'Restaurante',
  createdAt: d.fecha ?? d.createdAt ?? new Date().toISOString(),
  subtotal: Number(d.subtotal ?? d.total ?? 0),
  
  donation: d.montoDonacion != null ? Number(d.montoDonacion)
    : d.donationAmount != null ? Number(d.donationAmount)
    : typeof d.donation === 'object' && d.donation !== null
      ? Number(d.donation.donationAmount ?? d.donation.amount ?? 0)
      : d.donation != null ? Number(d.donation) : null,
  donationFoundation: d.donation?.foundationName ?? d.donation?.foundation?.name ?? d.donationFoundation ?? null,
  donationPercentage: d.donation?.percentage ?? d.porcentajeDonacion ?? null,

  total: Number(d.total ?? 0),
  status: d.estado ?? d.status ?? 'confirmed',
  paymentMethod: d.pago?.metodoPago ?? d.metodoPago ?? d.paymentMethod,
  items: (d.productos ?? d.items ?? []).map((i) => ({
    name: i.nombre ?? i.producto?.nombre ?? i.name,
    quantity: Number(i.cantidad ?? i.quantity ?? 1),
    unitPrice: Number(i.precioUnitario ?? i.precio ?? i.unitPrice ?? 0),
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
