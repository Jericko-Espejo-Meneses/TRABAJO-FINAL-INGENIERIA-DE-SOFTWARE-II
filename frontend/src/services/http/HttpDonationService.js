import { DonationService } from '../contracts';

export class HttpDonationService extends DonationService {
  constructor(http) { super(); this.http = http; }
  async getSummary() {
    const res = await this.http.get('/donaciones/resumen');
    return { total: Number(res.total), count: res.cantidad ?? res.count ?? 0 };
  }
}
