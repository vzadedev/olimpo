import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { UpdateProfileInput } from './dto/update-profile.input';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  wallpaperUrl: true,
  avatarUrl: true,
  appIconUrl: true,
  theme: true,
  instagramUsername: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    if (!user) return null;

    const stats = await this.gamification.getUserGlobalStats(id);
    const exerciseTitles = await this.gamification.getUserExerciseTitles(id);

    return {
      ...user,
      globalRank: stats.globalRank,
      globalScore: stats.globalScore,
      exerciseTitles,
    };
  }

  updateProfile(userId: string, input: UpdateProfileInput) {
    return this.prisma.user
      .update({
        where: { id: userId },
        data: { ...input, updatedUserId: userId },
        select: publicUserSelect,
      })
      .then(async (user) => {
        const stats = await this.gamification.getUserGlobalStats(userId);
        const exerciseTitles = await this.gamification.getUserExerciseTitles(userId);
        return {
          ...user,
          globalRank: stats.globalRank,
          globalScore: stats.globalScore,
          exerciseTitles,
        };
      });
  }
}
