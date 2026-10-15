// Regla de negocio (HE-HU5-005): el porcentaje se destina del pago, no se suma al total.
export const calculateDonation = (total, percentage) =>
  Math.round(total * percentage) / 100;
