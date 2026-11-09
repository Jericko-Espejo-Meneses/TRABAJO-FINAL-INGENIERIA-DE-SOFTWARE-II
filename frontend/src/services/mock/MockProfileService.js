import { ProfileService } from '../contracts';
import { db, delay, persist, publicUser, userIdFromToken } from './db';

export class MockProfileService extends ProfileService {
  constructor(tokenStorage) { super(); this.tokenStorage = tokenStorage; }

  async update({ name, address, bio }) {
    await delay(400);
    const user = db.users.find((u) => u.id === userIdFromToken(this.tokenStorage.get()));
    if (!user) throw new Error('Sesión inválida');
    Object.assign(user, { name, address, bio });
    persist();
    return publicUser(user);
  }
}
