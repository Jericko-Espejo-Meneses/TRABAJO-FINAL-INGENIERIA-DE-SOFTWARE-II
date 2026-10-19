import { HttpClient } from './HttpClient';

// PATRÓN DECORATOR: envuelve un HttpClient y le agrega el token JWT
// y el manejo de 401, sin modificar la clase original (Open/Closed).
export class AuthHttpClient extends HttpClient {
  constructor(inner, tokenStorage, onUnauthorized = () => {}) {
    super(inner.baseUrl);
    this.inner = inner;
    this.tokenStorage = tokenStorage;
    this.onUnauthorized = onUnauthorized;
  }

  async request(method, path, opts = {}) {
    const token = this.tokenStorage.get();
    const headers = { ...opts.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    try {
      return await this.inner.request(method, path, { ...opts, headers });
    } catch (error) {
      if (error.status === 401) this.onUnauthorized();
      throw error;
    }
  }
}
