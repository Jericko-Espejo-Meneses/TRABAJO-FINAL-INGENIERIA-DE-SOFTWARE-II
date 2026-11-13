// Singleton de configuración: una sola fuente de verdad para toda la app.
const rawApiUrl = (import.meta.env.VITE_API_URL ?? 'https://ingsoft-backend-1.onrender.com/api').trim();
const trimmedApiUrl = rawApiUrl.replace(/\/+$/, '');
const apiUrl = trimmedApiUrl.endsWith('/api') || trimmedApiUrl.endsWith('/api/v1')
  ? trimmedApiUrl
  : `${trimmedApiUrl}/api`;

export const config = Object.freeze({
  apiUrl,
  useMock: (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true',
  donationPercentage: Number(import.meta.env.VITE_DONATION_PERCENTAGE ?? 3),
});
