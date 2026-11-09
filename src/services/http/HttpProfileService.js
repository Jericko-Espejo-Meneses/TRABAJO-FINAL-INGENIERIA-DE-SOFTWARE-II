import { ProfileService } from '../contracts';
import { toUser } from '../../domain/mappers';

export class HttpProfileService extends ProfileService {
  constructor(http) { super(); this.http = http; }

  // El backend (UpdateProfileDto) solo acepta fullName, phone, avatarUrl,
  // dietaryPreferences y healthGoals. Dirección y biografía no existen allí.
  async update({ name }) {
    const res = await this.http.patch('/usuarios/me', { fullName: name });
    return toUser(res);
  }
}
