import { AuthService } from '../contracts';
import { toUser } from '../../domain/mappers';

export class HttpAuthService extends AuthService {
  constructor(http) { super(); this.http = http; }

  async login({ email, password }) {
    const res = await this.http.post('/auth/login', { correo: email, contrasena: password });
    return { token: res.token, user: toUser(res.usuario) };
  }

  async register({ name, email, password, address }) {
    const res = await this.http.post('/auth/register', {
      nombre: name, correo: email, contrasena: password, direccion: address,
    });
    return { token: res.token, user: toUser(res.usuario) };
  }

  loginWithProvider(provider) {
    // El backend inicia el flujo OAuth y vuelve al front con ?token=...
    window.location.assign(`${this.http.baseUrl}/auth/oauth/${provider}`);
    return new Promise(() => {});
  }

  async getCurrentUser() { return toUser(await this.http.get('/auth/me')); }
}
