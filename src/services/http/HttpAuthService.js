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


  async getCurrentUser() { return toUser(await this.http.get('/auth/me')); }
}
