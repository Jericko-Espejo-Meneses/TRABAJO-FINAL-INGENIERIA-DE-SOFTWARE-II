import { CanActivate, ExecutionContext, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdminController } from './catalog-admin.controller';

describe('Administración del catálogo por HTTP', () => {
  let app: INestApplication;
  let url: string;
  const db = {
    user: { findFirst: jest.fn(), findMany: jest.fn() },
    restaurant: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    menuItem: { create: jest.fn() },
  };
  const auth: CanActivate = {
    canActivate(context: ExecutionContext) {
      const req = context.switchToHttp().getRequest();
      const identity = req.headers['x-test-user'];
      if (!identity) throw new UnauthorizedException();
      req.user = { id: identity, catalogPasswordLogin: req.headers['x-login'] === 'password' };
      return true;
    },
  };
  const restaurant = { ownerId: 'owner-1', name: 'Verde', address: 'Lima 100', foodType: 'Ensaladas', latitude: -12, longitude: -77 };
  const dish = { name: 'Bowl', category: 'Ensaladas', price: 12.5, stock: 3, isAvailable: true };
  const post = (path: string, body: object, id = 'admin-test', login = 'password') =>
    fetch(url + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': id, 'x-login': login }, body: JSON.stringify(body) });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CatalogAdminController],
      providers: [
        { provide: PrismaService, useValue: db },
        { provide: ConfigService, useValue: new ConfigService({ CATALOG_ADMIN_USER_IDS: 'admin-test', JWT_SECRET: 'a'.repeat(48) }) },
      ],
    }).overrideGuard(JwtAuthGuard).useValue(auth).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: true } }));
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl() + '/admin/catalog';
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); });

  it('exige sesión', async () => { expect((await post('/restaurants', restaurant, '')).status).toBe(401); });
  it.each([['cliente', 'password'], ['admin-test', 'social']])('deniega escritura a %s con %s', async (id, login) => {
    expect((await post('/restaurants', restaurant, id, login)).status).toBe(403);
    expect(db.restaurant.create).not.toHaveBeenCalled();
  });
  it('rechaza coordenadas fuera de rango', async () => {
    expect((await post('/restaurants', { ...restaurant, latitude: 100 })).status).toBe(400);
  });
  it('registra el restaurante con sus coordenadas', async () => {
    db.user.findFirst.mockResolvedValue({ id: 'owner-1' });
    db.restaurant.create.mockResolvedValue({ id: 'r1', name: 'Verde' });
    const response = await post('/restaurants', restaurant);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 'r1', name: 'Verde' });
    expect(db.restaurant.create.mock.calls[0][0].data).toMatchObject(restaurant);
  });
  it.each([{ price: 0 }, { stock: -1 }, { stock: 1.2 }, { isAvailable: 'false' }, { price: '' }])('rechaza datos de plato inválidos %j', async delta => {
    expect((await post('/restaurants/r1/dishes', { ...dish, ...delta })).status).toBe(400);
    expect(db.menuItem.create).not.toHaveBeenCalled();
  });
  it('rechaza restaurante inexistente', async () => {
    db.restaurant.findUnique.mockResolvedValue(null);
    expect((await post('/restaurants/r1/dishes', dish)).status).toBe(404);
  });
  it('guarda plato en el restaurante seleccionado con disponibilidad y stock', async () => {
    db.restaurant.findUnique.mockResolvedValue({ ownerId: 'owner-1' });
    db.menuItem.create.mockResolvedValue({ id: 'd1', restaurantId: 'r1', name: dish.name });
    expect((await post('/restaurants/r1/dishes', dish, 'owner-1')).status).toBe(201);
    expect(db.menuItem.create.mock.calls[0][0].data).toMatchObject({ ...dish, restaurantId: 'r1' });
  });

  it('impide asignar una cuenta inexistente', async () => {
    db.user.findFirst.mockResolvedValue(null);
    expect((await post('/restaurants', restaurant)).status).toBe(404);
    expect(db.restaurant.create).not.toHaveBeenCalled();
  });

  it.each(['owner-2', 'admin-test', 'cliente'])('impide que %s publique en el local de otra cuenta', async id => {
    db.restaurant.findUnique.mockResolvedValue({ ownerId: 'owner-1' });
    const response = await post('/restaurants/r1/dishes', dish, id);
    expect(response.status).toBe(403);
    expect(db.menuItem.create).not.toHaveBeenCalled();
  });

  it('restringe la lista de locales a la identidad autenticada', async () => {
    db.restaurant.findMany.mockResolvedValue([{ id: 'r1', name: 'Verde' }]);
    const response = await fetch(url + '/access', { headers: { 'x-test-user': 'owner-1', 'x-login': 'password' } });
    expect(await response.json()).toEqual({ canRegister: false, restaurants: [{ id: 'r1', name: 'Verde' }] });
    expect(db.restaurant.findMany.mock.calls[0][0].where).toEqual({ ownerId: 'owner-1' });
  });

  it('solo el administrador puede seleccionar cuentas para asignar', async () => {
    const response = await fetch(url + '/accounts', { headers: { 'x-test-user': 'owner-1', 'x-login': 'password' } });
    expect(response.status).toBe(403);
    expect(db.user.findMany).not.toHaveBeenCalled();
  });
});
