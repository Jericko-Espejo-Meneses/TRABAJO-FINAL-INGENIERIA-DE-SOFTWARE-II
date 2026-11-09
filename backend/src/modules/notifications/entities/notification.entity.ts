export type NotificationType = 'PROMOTION' | 'ACHIEVEMENT' | 'ORDER_UPDATE' | 'DONATION';

export class Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}
