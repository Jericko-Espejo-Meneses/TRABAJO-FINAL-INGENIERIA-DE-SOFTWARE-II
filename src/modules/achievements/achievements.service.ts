import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Achievement, UserAchievementProgress } from './entities/achievement.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.db.achievements.values());
  }

  /**
   * HE-HU7-007: Progreso del usuario en insignias y logros de alimentación saludable
   */
  async getUserAchievements(userId: string): Promise<UserAchievementProgress[]> {
    let userMap = this.db.userAchievements.get(userId);
    if (!userMap) {
      userMap = new Map<string, UserAchievementProgress>();
      for (const ach of this.db.achievements.values()) {
        userMap.set(ach.id, {
          achievementId: ach.id,
          achievement: ach,
          currentCount: 0,
          isUnlocked: false,
        });
      }
      this.db.userAchievements.set(userId, userMap);
    }

    return Array.from(userMap.values());
  }

  async incrementProgress(userId: string, achievementId: string, amount: number = 1): Promise<UserAchievementProgress | null> {
    const ach = this.db.achievements.get(achievementId);
    if (!ach) return null;

    let userMap = this.db.userAchievements.get(userId);
    if (!userMap) {
      await this.getUserAchievements(userId);
      userMap = this.db.userAchievements.get(userId)!;
    }

    let progress = userMap.get(achievementId);
    if (!progress) {
      progress = {
        achievementId,
        achievement: ach,
        currentCount: 0,
        isUnlocked: false,
      };
      userMap.set(achievementId, progress);
    }

    if (!progress.isUnlocked) {
      progress.currentCount += amount;
      if (progress.currentCount >= ach.targetCount) {
        progress.isUnlocked = true;
        progress.unlockedAt = new Date();

        // Notificar al usuario sobre su logro (HE-HU7-007)
        await this.notificationsService.createNotification(
          userId,
          `🏆 ¡Logro desbloqueado: ${ach.title}!`,
          ach.description,
          'ACHIEVEMENT',
          { badgeIcon: ach.badgeIcon, achievementId },
        );
      }
    }

    return progress;
  }
}
