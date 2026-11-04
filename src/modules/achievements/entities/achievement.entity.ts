export class Achievement {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  category: 'HEALTH' | 'COMMUNITY' | 'ORDERS';
  targetCount: number;
}

export class UserAchievementProgress {
  achievementId: string;
  achievement: Achievement;
  currentCount: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}
