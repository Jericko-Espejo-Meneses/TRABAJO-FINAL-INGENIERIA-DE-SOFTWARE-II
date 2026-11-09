import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Achievement, UserAchievementProgress } from './entities/achievement.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  private mapDbAchievement(dbAch: any): Achievement {
    return {
      id: dbAch.id,
      title: dbAch.title,
      description: dbAch.description,
      badgeIcon: dbAch.badgeIconUrl || dbAch.badgeIcon || '🏆',
      category: dbAch.category as any,
      targetCount: dbAch.targetCount,
    };
  }

  async getAllAchievements(): Promise<Achievement[]> {
    if (this.prisma.connected) {
      try {
        const dbAchievements = await this.prisma.achievement.findMany();
        if (dbAchievements && dbAchievements.length > 0) {
          const achievements = dbAchievements.map((dba) => this.mapDbAchievement(dba));
          for (const a of achievements) {
            this.db.achievements.set(a.id, a);
          }
          return achievements;
        }
      } catch (error: any) {
        this.logger.warn(`Error fetching achievements from Prisma: ${error?.message || error}`);
      }
    }
    return Array.from(this.db.achievements.values());
  }

  /**
   * HE-HU7-007: Progreso del usuario en insignias y logros de alimentación saludable
   */
  async getUserAchievements(userId: string): Promise<UserAchievementProgress[]> {
    if (this.prisma.connected) {
      try {
        const userAchs = await this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: true },
        });

        if (userAchs && userAchs.length > 0) {
          const progressList: UserAchievementProgress[] = userAchs.map((ua) => ({
            achievementId: ua.achievementId,
            achievement: ua.achievement
              ? this.mapDbAchievement(ua.achievement)
              : this.db.achievements.get(ua.achievementId) || {
                  id: ua.achievementId,
                  title: 'Logro',
                  description: '',
                  badgeIcon: '🏆',
                  category: 'HEALTH' as const,
                  targetCount: ua.targetCount,
                },
            currentCount: ua.currentCount,
            isUnlocked: ua.isUnlocked,
            unlockedAt: ua.unlockedAt ? new Date(ua.unlockedAt) : undefined,
          }));

          // Synchronize in-memory cache
          let userMap = this.db.userAchievements.get(userId);
          if (!userMap) {
            userMap = new Map<string, UserAchievementProgress>();
            this.db.userAchievements.set(userId, userMap);
          }
          for (const item of progressList) {
            userMap.set(item.achievementId, item);
          }

          return progressList;
        }
      } catch (error: any) {
        this.logger.warn(`Error fetching user achievements from Prisma: ${error?.message || error}`);
      }
    }

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
    let ach = this.db.achievements.get(achievementId);
    if (!ach && this.prisma.connected) {
      try {
        const dbAch = await this.prisma.achievement.findUnique({
          where: { id: achievementId },
        });
        if (dbAch) {
          ach = this.mapDbAchievement(dbAch);
          this.db.achievements.set(ach.id, ach);
        }
      } catch (error: any) {
        this.logger.warn(`Error fetching achievement ${achievementId} from Prisma: ${error?.message || error}`);
      }
    }

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

    if (this.prisma.connected) {
      try {
        await this.prisma.achievement.upsert({
          where: { id: ach.id },
          update: {},
          create: {
            id: ach.id,
            code: `ACH_${ach.id.toUpperCase().replace(/-/g, '_')}`,
            title: ach.title,
            description: ach.description,
            badgeIconUrl: ach.badgeIcon,
            category: ach.category.toLowerCase(),
            targetCount: ach.targetCount,
          },
        }).catch(() => {});

        await this.prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },
          update: {
            currentCount: progress.currentCount,
            isUnlocked: progress.isUnlocked,
            unlockedAt: progress.unlockedAt,
            targetCount: ach.targetCount,
          },
          create: {
            userId,
            achievementId,
            currentCount: progress.currentCount,
            targetCount: ach.targetCount,
            isUnlocked: progress.isUnlocked,
            unlockedAt: progress.unlockedAt,
          },
        });
      } catch (error: any) {
        this.logger.warn(`Error persisting user achievement progress to Prisma: ${error?.message || error}`);
      }
    }

    return progress;
  }
}
