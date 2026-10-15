// "Base de datos" falsa persistida en localStorage solo para el modo demo.
const KEY = 'he-mock-db';
const seed = () => ({
  users: [{ id: 'u1', name: 'Usuario Demo', email: 'demo@healthyexpress.com', password: 'Demo1234', address: 'Av. Larco 123, Miraflores', phone: '', preferences: ['high-protein'] }],
  orders: [],
});

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? seed(); } catch { return seed(); }
};

export const db = load();
export const persist = () => localStorage.setItem(KEY, JSON.stringify(db));
export const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
export const publicUser = ({ password, ...user }) => user;
export const userIdFromToken = (token) => token?.replace('mock-', '');
