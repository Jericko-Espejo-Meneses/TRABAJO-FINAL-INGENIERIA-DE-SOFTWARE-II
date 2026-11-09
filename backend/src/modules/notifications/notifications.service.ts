import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  private mapDbToEntity(row: any): Notification {
    let metadata: Record<string, any> | undefined;
    if (row.metadata) {
      try {
        metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      } catch {
        metadata = undefined;
      }
    }

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      message: row.message,
      type: row.type as NotificationType,
      isRead: Boolean(row.isRead),
      metadata,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    };
  }

  /**
   * HE-HU7-007: Obtener notificaciones del usuario (promociones, logros, estados de pedido)
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    if (this.prisma?.connected) {
      try {
        const rows = await this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        const notifications = rows.map((row) => this.mapDbToEntity(row));
        for (const notif of notifications) {
          this.db.notifications.set(notif.id, notif);
        }
        return notifications;
      } catch {
        // Fallback a memoria en caso de error en base de datos
      }
    }

    return Array.from(this.db.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    let notif = this.db.notifications.get(notificationId);

    if ((!notif || notif.userId !== userId) && this.prisma?.connected) {
      try {
        const dbNotif = await this.prisma.notification.findUnique({
          where: { id: notificationId },
        });
        if (dbNotif && dbNotif.userId === userId) {
          notif = this.mapDbToEntity(dbNotif);
          this.db.notifications.set(notificationId, notif);
        }
      } catch {
        // Fallback a memoria
      }
    }

    if (!notif || notif.userId !== userId) {
      throw new NotFoundException(`Notificación con ID ${notificationId} no encontrada`);
    }

    notif.isRead = true;
    this.db.notifications.set(notificationId, notif);

    if (this.prisma?.connected) {
      try {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
      } catch {
        // Resiliente ante error de base de datos
      }
    }

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

    if (this.prisma?.connected) {
      try {
        const result = await this.prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
        count = Math.max(count, result.count);
      } catch {
        // Resiliente ante error de base de datos
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

    if (this.prisma?.connected) {
      try {
        await this.prisma.notification.create({
          data: {
            id: notification.id,
            userId,
            title,
            message,
            type,
            isRead: false,
            metadata: metadata ? JSON.stringify(metadata) : null,
            createdAt: notification.createdAt,
          },
        });
      } catch {
        // Resiliente ante error de base de datos
      }
    }

    return notification;
  }
}
