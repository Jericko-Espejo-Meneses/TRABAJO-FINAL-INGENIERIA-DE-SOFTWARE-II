import { DonationService } from '../contracts';
import { db, delay, userIdFromToken } from './db';

export class MockDonationService extends DonationService {
  constructor(tokenStorage) { super(); this.tokenStorage = tokenStorage; }
  async getSummary() {
    await delay(150);
    const mine = db.orders.filter((o) => o.userId === userIdFromToken(this.tokenStorage.get()));
    return { total: Math.round(mine.reduce((s, o) => s + o.donation, 0) * 100) / 100, count: mine.length };
  }
}
