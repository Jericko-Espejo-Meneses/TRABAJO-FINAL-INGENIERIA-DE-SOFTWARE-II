// Singleton de configuración: una sola fuente de verdad para toda la app.
export const config = Object.freeze({
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  useMock: (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true',
  donationPercentage: Number(import.meta.env.VITE_DONATION_PERCENTAGE ?? 5),
});
