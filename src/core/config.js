// Singleton de configuración: una sola fuente de verdad para toda la app.
export const config = Object.freeze({
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  useMock: (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true',
});
