import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { distanceInMeters, MAX_DISTANCE_METERS } from '../common/geo.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CheckinService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getPrivacy(userId: string) {
    return this.prisma.userPrivacySettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePrivacy(
    userId: string,
    input: {
      publicCheckin?: boolean;
      publicProfile?: boolean;
      showInRankings?: boolean;
      autoBattlePosts?: boolean;
    },
  ) {
    return this.prisma.userPrivacySettings.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
  }

  async checkin(
    userId: string,
    gymId: string,
    latitude: number,
    longitude: number,
    isPublic?: boolean,
  ) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Academia não encontrada');

    const dist = distanceInMeters(latitude, longitude, gym.latitude, gym.longitude);
    if (dist > MAX_DISTANCE_METERS) {
      throw new BadRequestException(
        `Você precisa estar a até ${MAX_DISTANCE_METERS}m da academia`,
      );
    }

    const privacy = await this.getPrivacy(userId);
    const publicFlag = privacy.publicCheckin && (isPublic ?? true);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);

    await this.prisma.checkin.updateMany({
      where: { userId, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    return this.prisma.checkin.create({
      data: {
        userId,
        gymId,
        isPublic: publicFlag,
        expiresAt,
      },
      include: {
        gym: { select: { name: true } },
        user: { select: { id: true, name: true, avatarUrl: true, instagramUsername: true } },
      },
    });
  }

  async activeCheckins(city?: string) {
    const now = new Date();
    const users = city
      ? await this.prisma.user.findMany({ where: { city }, select: { id: true } })
      : null;

    return this.prisma.checkin.findMany({
      where: {
        isPublic: true,
        expiresAt: { gt: now },
        ...(users ? { userId: { in: users.map((u) => u.id) } } : {}),
      },
      include: {
        gym: { select: { name: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { reactions: true } },
      },
      orderBy: { checkedInAt: 'desc' },
      take: 30,
    });
  }

  async reactToCheckin(userId: string, checkinId: string) {
    const checkin = await this.prisma.checkin.findUnique({ where: { id: checkinId } });
    if (!checkin) throw new NotFoundException('Check-in não encontrado');

    await this.prisma.checkinReaction.upsert({
      where: { checkinId_userId: { checkinId, userId } },
      create: { checkinId, userId },
      update: {},
    });

    if (checkin.userId !== userId) {
      await this.notifications.create({
        userId: checkin.userId,
        type: 'checkin_reaction',
        referenceId: checkinId,
        referenceType: 'checkin',
      });
    }

    return { ok: true };
  }
}
