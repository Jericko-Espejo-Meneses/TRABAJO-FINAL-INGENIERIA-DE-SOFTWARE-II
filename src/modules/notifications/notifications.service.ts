import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * HE-HU7-007: Obtener notificaciones del usuario (promociones, logros, estados de pedido)
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.db.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notif = this.db.notifications.get(notificationId);
    if (!notif || notif.userId !== userId) {
      throw new NotFoundException(`Notificación con ID ${notificationId} no encontrada`);
    }

    notif.isRead = true;
    this.db.notifications.set(notificationId, notif);
    return notif;
  }

  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    let count = 0;
    for (const notif of this.db.notifications.values()) {
      if (notif.userId === userId && !notif.isRead) {
        notif.isRead = true;
        this.db.notifications.set(notif.id, notif);
        count++;
      }
    }
    return { updatedCount: count };
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${uuidv4().substring(0, 8)}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      metadata,
      createdAt: new Date(),
    };

    this.db.notifications.set(notification.id, notification);
    return notification;
  }
}
