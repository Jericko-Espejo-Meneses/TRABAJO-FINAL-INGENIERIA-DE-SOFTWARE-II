import { RecommendationService } from '../contracts';
import { toDish } from '../../domain/mappers';

export class HttpRecommendationService extends RecommendationService {
  constructor(http) { super(); this.http = http; }
  async getRecommendations() { return (await this.http.get('/recomendaciones')).map(toDish); }
  async getPreferences() { return this.http.get('/usuarios/me/preferencias'); }
  async savePreferences(ids) { await this.http.put('/usuarios/me/preferencias', ids); }
}
