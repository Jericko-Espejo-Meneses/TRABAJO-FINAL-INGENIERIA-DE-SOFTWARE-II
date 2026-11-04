import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { DatabaseService } from '../../database/database.service';

describe('NotificationsService (Sprint 6: HE-HU7-007)', () => {
  let service: NotificationsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, DatabaseService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('HE-HU7-007: debe listar notificaciones del usuario (promociones y logros)', async () => {
    const notifs = await service.getUserNotifications('user-demo-1');
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs.some((n) => n.type === 'PROMOTION')).toBe(true);
    expect(notifs.some((n) => n.type === 'ACHIEVEMENT')).toBe(true);
  });

  it('HE-HU7-007: debe marcar una notificación como leída', async () => {
    const notifs = await service.getUserNotifications('user-demo-1');
    const unread = notifs.find((n) => !n.isRead);
    expect(unread).toBeDefined();

    const updated = await service.markAsRead('user-demo-1', unread!.id);
    expect(updated.isRead).toBe(true);
  });
});
