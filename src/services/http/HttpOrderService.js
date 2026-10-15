import { OrderService } from '../contracts';
import { toOrder, toOrderDto } from '../../domain/mappers';

export class HttpOrderService extends OrderService {
  constructor(http) { super(); this.http = http; }
  async create(orderRequest) { return toOrder(await this.http.post('/pedidos', toOrderDto(orderRequest))); }
  async list() { return (await this.http.get('/pedidos')).map(toOrder); }
}
