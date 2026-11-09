import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { DatabaseService } from '../../database/database.service';

describe('RecommendationsService (Sprint 3: HE-HU3-003)', () => {
  let service: RecommendationsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecommendationsService, DatabaseService],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('debe recomendar menús orientados a pérdida de peso y respetar límite de calorías', async () => {
    const recommendations = await service.getRecommendations({
      healthGoal: 'weight_loss',
      maxCalories: 400,
    });

    expect(recommendations.length).toBeGreaterThan(0);
    recommendations.forEach((item) => {
      expect(item.nutritionalInfo.calories).toBeLessThanOrEqual(400);
      expect(item.matchScore).toBeGreaterThan(0);
      expect(item.matchReasons.length).toBeGreaterThan(0);
    });
  });

  it('debe recomendar menús con alta proteína para ganancia muscular', async () => {
    const recommendations = await service.getRecommendations({
      healthGoal: 'muscle_gain',
      minProtein: 30,
    });

    expect(recommendations.length).toBeGreaterThan(0);
    recommendations.forEach((item) => {
      expect(item.nutritionalInfo.proteinGrams).toBeGreaterThanOrEqual(30);
    });
  });

  it('debe entregar recomendaciones personalizadas según las metas del usuario', async () => {
    const personalized = await service.getPersonalizedRecommendations('user-demo-1');
    expect(personalized.length).toBeGreaterThan(0);
    expect(personalized[0].matchScore).toBeGreaterThan(0);
  });
});
