import { AuthService } from '../contracts';
import { db, delay, persist, publicUser, userIdFromToken } from './db';

export class MockAuthService extends AuthService {
  constructor(tokenStorage) { super(); this.tokenStorage = tokenStorage; }

  async login({ email, password }) {
    await delay();
    const user = db.users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
    if (!user) throw new Error('Correo o contraseña incorrectos');
    return { token: `mock-${user.id}`, user: publicUser(user) };
  }

  async register({ name, email, password, address }) {
    await delay();
    const mail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email === mail)) throw new Error('Ya existe una cuenta con ese correo');
    const user = { id: `u${Date.now()}`, name, email: mail, password, address: address ?? '', phone: '', preferences: [] };
    db.users.push(user);
    persist();
    return { token: `mock-${user.id}`, user: publicUser(user) };
  }

  async loginWithProvider() {
    await delay();
    return { token: `mock-${db.users[0].id}`, user: publicUser(db.users[0]) };
  }

  async getCurrentUser() {
    await delay(100);
    const user = db.users.find((u) => u.id === userIdFromToken(this.tokenStorage.get()));
    if (!user) throw new Error('Sesión inválida');
    return publicUser(user);
  }
}
