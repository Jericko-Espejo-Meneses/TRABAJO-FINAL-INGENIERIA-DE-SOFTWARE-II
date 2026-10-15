import { RestaurantService } from '../contracts';
import { matchesFilter } from '../../domain/restaurantFilters';
import { delay } from './db';
import { restaurants } from './data';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const strip = ({ menu, ...restaurant }) => restaurant;

export class MockRestaurantService extends RestaurantService {
  async search({ query = '', tags = [], foodType = '', maxDistanceKm = null } = {}) {
    await delay(250);
    const q = norm(query);
    return restaurants
      .filter((r) => !q || norm(`${r.name} ${r.foodType} ${r.menu.map((d) => d.name).join(' ')}`).includes(q))
      .filter((r) => !foodType || r.foodType === foodType)
      .filter((r) => maxDistanceKm == null || r.distanceKm <= maxDistanceKm)
      .filter((r) => tags.every((id) => matchesFilter(id, r)))
      .map(strip);
  }

  async getById(id) {
    await delay(200);
    const r = restaurants.find((x) => x.id === id);
    if (!r) throw new Error('Restaurante no encontrado');
    return { restaurant: strip(r), menu: r.menu };
  }
}
