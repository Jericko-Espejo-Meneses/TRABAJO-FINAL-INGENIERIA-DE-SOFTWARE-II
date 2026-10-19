import { ProfileService } from '../contracts';
import { toUser } from '../../domain/mappers';

export class HttpProfileService extends ProfileService {
  constructor(http) { super(); this.http = http; }

  async update({ name, address, bio }) {
    const res = await this.http.put('/usuarios/me', { nombre: name, direccion: address, biografia: bio });
    return toUser(res);
  }
}
