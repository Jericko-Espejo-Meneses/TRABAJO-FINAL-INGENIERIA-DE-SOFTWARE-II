import { Test, TestingModule } from '@nestjs/testing';
import { DonationsService } from './donations.service';
import { DatabaseService } from '../../database/database.service';

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
    expect(foundations[0].name).toContain('Banco de Alimentos');
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
});
