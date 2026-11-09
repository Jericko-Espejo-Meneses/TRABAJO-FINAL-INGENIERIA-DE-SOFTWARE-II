import { Test, TestingModule } from '@nestjs/testing';
import { DonationsService } from './donations.service';
import { DatabaseService } from '../../database/database.service';
import { Order } from '../orders/entities/order.entity';
import { PrismaService } from '../../prisma/prisma.service';

describe('DonationsService (Sprint 4: HE-HU5-005 & Sprint 5: HE-HU6-006)', () => {
  let service: DonationsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DonationsService, DatabaseService],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('HE-HU5-005: debe listar las fundaciones aliadas disponibles', async () => {
    const foundations = await service.getFoundations();
    expect(foundations.length).toBeGreaterThan(0);
    expect(foundations.some((f) => f.id === 'found-wfp')).toBe(true);
  });

  it('HE-HU6-006: debe calcular el impacto social acumulado del usuario', async () => {
    const impact = await service.getUserImpact('user-demo-1');
    expect(impact).toBeDefined();
    expect(impact.totalDonated).toBeGreaterThan(0);
    expect(impact.totalMealsEquivalent).toBeGreaterThan(0);
    expect(impact.beneficiaryFoundations.length).toBeGreaterThan(0);
  });

  it('HE-HU6-006: debe retornar el historial detallado de donaciones', async () => {
    const donations = await service.getUserDonations('user-demo-1');
    expect(donations.length).toBeGreaterThan(0);
    expect(donations[0].orderTotal).toBeDefined();
    expect(donations[0].percentage).toBe(3);
  });

  it('registra el 3% para WFP sin aumentar el total ni duplicar la donación', async () => {
    const order = { id: 'test-wfp', userId: 'test-user', total: 50 } as Order;
    const donation = await service.processAutomaticDonation(order);
    expect(donation).toMatchObject({ donationAmount: 1.5, percentage: 3, foundationId: 'found-wfp', foundationName: 'World Food Programme (WFP)' });
    expect(order.total).toBe(50);
    expect(await service.processAutomaticDonation(order)).toEqual(donation);
    expect((await service.getUserImpact('test-user')).totalDonated).toBe(1.5);
  });

  it('conserva el beneficiario solicitado explícitamente', async () => {
    const donation = await service.processAutomaticDonation({ id: 'other', userId: 'u', total: 50 } as Order, 'found-1');
    expect(donation.foundationName).toBe('Banco de Alimentos Perú');
    await expect(service.processAutomaticDonation({ id: 'invalid', total: 50 } as Order, 'missing')).rejects.toThrow();
  });

  it('persiste y recupera monto y beneficiario desde PostgreSQL', async () => {
    let saved: any;
    const prisma = {
      connected: true,
      foundation: { upsert: jest.fn().mockResolvedValue({}) },
      donation: {
        findUnique: jest.fn(async () => saved ?? null),
        create: jest.fn(async ({ data }) => { saved = { ...data, createdAt: new Date(), foundation: { name: 'World Food Programme (WFP)' } }; return saved; }),
        findMany: jest.fn(async () => [saved]),
      },
    };
    const persistent = new DonationsService(db, prisma as unknown as PrismaService);
    const order = { id: 'persisted', userId: 'persist-user', total: 50 } as Order;
    await persistent.processAutomaticDonation(order);
    expect(prisma.donation.create).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 1.5, percentage: 3, foundationId: 'found-wfp', orderId: 'persisted' }) });
    db.donations.clear();
    const restarted = new DonationsService(db, prisma as unknown as PrismaService);
    expect((await restarted.getUserDonations('persist-user'))[0]).toMatchObject({ donationAmount: 1.5, foundationName: 'World Food Programme (WFP)' });
    expect((await restarted.getUserImpact('persist-user')).totalDonated).toBe(1.5);
    await restarted.processAutomaticDonation(order);
    expect(prisma.donation.create).toHaveBeenCalledTimes(1);
  });
});
