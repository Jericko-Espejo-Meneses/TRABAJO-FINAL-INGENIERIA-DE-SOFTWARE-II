const KEY = 'he-token';

// Responsabilidad única: guardar/leer el token de sesión.
export class TokenStorage {
  constructor(storage = window.localStorage) { this.storage = storage; }
  get() { return this.storage.getItem(KEY); }
  set(token) { this.storage.setItem(KEY, token); }
  clear() { this.storage.removeItem(KEY); }
}
