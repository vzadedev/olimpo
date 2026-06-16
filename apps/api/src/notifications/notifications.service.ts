import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationInput = {
  userId: string;
  type: string;
  referenceId: string;
  referenceType: string;
};

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createMany(items: NotificationInput[]) {
    if (items.length === 0) return;
    await this.prisma.notification.createMany({ data: items });
  }

  async create(item: NotificationInput) {
    return this.prisma.notification.create({ data: item });
  }

  list(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  markRead(userId: string, ids?: string[]) {
    return this.prisma.notification.updateMany({
      where: { userId, ...(ids?.length ? { id: { in: ids } } : {}) },
      data: { read: true },
    });
  }
}
