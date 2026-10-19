import { RestaurantService } from '../contracts';
import { toDish, toRestaurant } from '../../domain/mappers';

export class HttpRestaurantService extends RestaurantService {
  constructor(http) { super(); this.http = http; }

  async search({ query, tags, foodType, maxDistanceKm } = {}, coords) {
    const list = await this.http.get('/restaurantes', {
      params: {
        q: query, tags, tipoComida: foodType, distanciaMax: maxDistanceKm,
        lat: coords?.lat, lng: coords?.lng,
      },
    });
    return list.map(toRestaurant);
  }

  async getById(id, coords) {
    const dto = await this.http.get(`/restaurantes/${id}`, { params: { lat: coords?.lat, lng: coords?.lng } });
    return { restaurant: toRestaurant(dto), menu: (dto.productos ?? []).map(toDish) };
  }
}
