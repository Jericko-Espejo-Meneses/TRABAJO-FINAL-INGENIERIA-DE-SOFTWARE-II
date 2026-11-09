import { RecommendationService } from '../contracts';
import { db, delay, persist, userIdFromToken } from './db';
import { restaurants } from './data';

export class MockRecommendationService extends RecommendationService {
  constructor(tokenStorage) { super(); this.tokenStorage = tokenStorage; }

  #user() { return db.users.find((u) => u.id === userIdFromToken(this.tokenStorage.get())); }

  async getPreferences() { await delay(100); return this.#user()?.preferences ?? []; }

  async savePreferences(ids) {
    await delay(200);
    const user = this.#user();
    if (user) { user.preferences = ids; persist(); }
  }

  async getRecommendations() {
    await delay(300);
    const prefs = this.#user()?.preferences ?? [];
    const rating = (d) => restaurants.find((r) => r.id === d.restaurantId).rating;
    return restaurants
      .flatMap((r) => r.menu)
      .map((d) => ({ ...d, matchedTags: d.tags.filter((t) => prefs.includes(t)) }))
      .filter((d) => prefs.length === 0 || d.matchedTags.length > 0)
      .sort((a, b) => b.matchedTags.length - a.matchedTags.length || rating(b) - rating(a))
      .slice(0, 8);
  }
}
