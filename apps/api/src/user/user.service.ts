import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { GoalsService } from '../goals/goals.service';
import { UpdateProfileInput } from './dto/update-profile.input';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  city: true,
  heightCm: true,
  weightKg: true,
  birthDate: true,
  sex: true,
  wallpaperUrl: true,
  avatarUrl: true,
  appIconUrl: true,
  theme: true,
  role: true,
  instagramUsername: true,
  createdAt: true,
  updatedAt: true,
} as const;

function computeBmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private goals: GoalsService,
  ) {}

  private enrichUser(
    user: {
      id: string;
      email: string;
      name: string | null;
      city: string | null;
      heightCm: number | null;
      weightKg: number | null;
      birthDate: Date | null;
      sex: string | null;
      wallpaperUrl: string | null;
      avatarUrl: string | null;
      appIconUrl: string | null;
      theme: string;
      role: string;
      instagramUsername: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    stats: { globalRank: string; globalScore: number },
    exerciseTitles: unknown,
  ) {
    const bmi =
      user.weightKg && user.heightCm
        ? computeBmi(user.weightKg, user.heightCm)
        : undefined;
    return {
      ...user,
      bmi,
      globalRank: stats.globalRank,
      globalScore: stats.globalScore,
      exerciseTitles,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    if (!user) return null;

    const stats = await this.gamification.getUserGlobalStats(id);
    const exerciseTitles = await this.gamification.getUserExerciseTitles(id);
    return this.enrichUser(user, stats, exerciseTitles);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { weightKg: true, heightCm: true },
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...input, updatedUserId: userId },
      select: publicUserSelect,
    });

    const nextWeight = input.weightKg ?? current?.weightKg;
    const nextHeight = input.heightCm ?? current?.heightCm;
    if (nextWeight && nextHeight) {
      const weightChanged =
        input.weightKg != null && input.weightKg !== current?.weightKg;
      if (weightChanged || input.heightCm != null) {
        await this.prisma.userBodyMetricLog.create({
          data: {
            userId,
            weightKg: nextWeight,
            heightCm: nextHeight,
            bmi: computeBmi(nextWeight, nextHeight),
          },
        });
      }
    }

    const stats = await this.gamification.getUserGlobalStats(userId);
    const exerciseTitles = await this.gamification.getUserExerciseTitles(userId);
    return this.enrichUser(user, stats, exerciseTitles);
  }

  bodyMetricHistory(userId: string, limit = 30) {
    return this.prisma.userBodyMetricLog.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        instagramUsername: true,
        city: true,
        heightCm: true,
        weightKg: true,
        privacySettings: { select: { publicProfile: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.privacySettings && !user.privacySettings.publicProfile) {
      throw new NotFoundException('Perfil privado');
    }

    const [stats, exerciseTitles, badges, submissionsCount] = await Promise.all([
      this.gamification.getUserGlobalStats(userId),
      this.gamification.getUserExerciseTitles(userId),
      this.goals.listBadges(userId),
      this.prisma.submission.count({ where: { userId } }),
    ]);

    const bmi =
      user.weightKg && user.heightCm
        ? Math.round((user.weightKg / ((user.heightCm / 100) ** 2)) * 10) / 10
        : undefined;

    return {
      id: user.id,
      name: user.name ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      instagramUsername: user.instagramUsername ?? undefined,
      city: user.city ?? undefined,
      globalRank: stats.globalRank,
      globalScore: stats.globalScore,
      bmi,
      exerciseTitles,
      badges,
      submissionsCount,
    };
  }
}
