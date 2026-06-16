import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RankingCategory } from './rankings.models';

type RankRow = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  best_bench: number | null;
  best_deadlift: number | null;
  best_squat: number | null;
  total_workouts: bigint | number | null;
};

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async refreshMaterializedView() {
    await this.prisma.$executeRawUnsafe(
      'REFRESH MATERIALIZED VIEW city_rankings',
    );
  }

  private async getCityUsers(city: string): Promise<RankRow[]> {
    await this.refreshMaterializedView().catch(() => undefined);
    return this.prisma.$queryRaw<RankRow[]>`
      SELECT user_id, name, avatar_url, city, best_bench, best_deadlift, best_squat, total_workouts
      FROM city_rankings
      WHERE city = ${city}
    `;
  }

  async getUserCity(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { city: true },
    });
    if (!user?.city) {
      throw new BadRequestException(
        'Defina sua cidade no perfil para ver os rankings',
      );
    }
    return user.city;
  }

  private computeStreak(userId: string, allSchedules: { user_id: string; completed: boolean; scheduled_date: Date }[]) {
    const days = new Set(
      allSchedules
        .filter((s) => s.user_id === userId && s.completed)
        .map((s) => s.scheduled_date.toISOString().slice(0, 10)),
    );
    let streak = 0;
    const check = new Date();
    check.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = check.toISOString().slice(0, 10);
      if (days.has(key)) streak += 1;
      else if (i === 0) {
        check.setDate(check.getDate() - 1);
        continue;
      } else break;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }

  async getRankings(city: string, category: RankingCategory, userId?: string) {
    const rows = await this.getCityUsers(city);
    let scored: { userId: string; name?: string; avatarUrl?: string; value: number; unit?: string }[] = [];

    if (category === RankingCategory.BENCH) {
      scored = rows
        .filter((r) => r.best_bench != null)
        .map((r) => ({
          userId: r.user_id,
          name: r.name ?? undefined,
          avatarUrl: r.avatar_url ?? undefined,
          value: Number(r.best_bench),
          unit: 'kg',
        }));
    } else if (category === RankingCategory.DEADLIFT) {
      scored = rows
        .filter((r) => r.best_deadlift != null)
        .map((r) => ({
          userId: r.user_id,
          name: r.name ?? undefined,
          avatarUrl: r.avatar_url ?? undefined,
          value: Number(r.best_deadlift),
          unit: 'kg',
        }));
    } else if (category === RankingCategory.SQUAT) {
      scored = rows
        .filter((r) => r.best_squat != null)
        .map((r) => ({
          userId: r.user_id,
          name: r.name ?? undefined,
          avatarUrl: r.avatar_url ?? undefined,
          value: Number(r.best_squat),
          unit: 'kg',
        }));
    } else if (category === RankingCategory.OVERALL) {
      scored = rows
        .map((r) => ({
          userId: r.user_id,
          name: r.name ?? undefined,
          avatarUrl: r.avatar_url ?? undefined,
          value:
            Number(r.best_bench ?? 0) +
            Number(r.best_deadlift ?? 0) +
            Number(r.best_squat ?? 0),
          unit: 'kg',
        }))
        .filter((r) => r.value > 0);
    } else if (category === RankingCategory.CONSISTENCY) {
      const userIds = rows.map((r) => r.user_id);
      const schedules = await this.prisma.workoutSchedule.findMany({
        where: { userId: { in: userIds }, completed: true },
        select: { userId: true, completed: true, scheduledDate: true },
      });
      const mapped = schedules.map((s) => ({
        user_id: s.userId,
        completed: s.completed,
        scheduled_date: s.scheduledDate,
      }));
      scored = rows.map((r) => ({
        userId: r.user_id,
        name: r.name ?? undefined,
        avatarUrl: r.avatar_url ?? undefined,
        value: this.computeStreak(r.user_id, mapped),
        unit: 'dias',
      }));
    } else if (category === RankingCategory.EVOLUTION) {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const userIds = rows.map((r) => r.user_id);
      const subs = await this.prisma.submission.findMany({
        where: {
          userId: { in: userIds },
          createdAt: { gte: since },
          exercise: {
            OR: [
              { name: { contains: 'supino', mode: 'insensitive' } },
              { name: { contains: 'terra', mode: 'insensitive' } },
              { name: { contains: 'agachamento', mode: 'insensitive' } },
            ],
          },
        },
        orderBy: { createdAt: 'asc' },
      });
      const evolution = new Map<string, number>();
      for (const uid of userIds) {
        const userSubs = subs.filter((s) => s.userId === uid);
        const byExercise = new Map<string, number[]>();
        for (const s of userSubs) {
          const list = byExercise.get(s.exerciseId) ?? [];
          list.push(s.weight);
          byExercise.set(s.exerciseId, list);
        }
        let totalGain = 0;
        for (const weights of byExercise.values()) {
          if (weights.length >= 2) {
            totalGain += weights[weights.length - 1] - weights[0];
          }
        }
        evolution.set(uid, totalGain);
      }
      scored = rows
        .map((r) => ({
          userId: r.user_id,
          name: r.name ?? undefined,
          avatarUrl: r.avatar_url ?? undefined,
          value: evolution.get(r.user_id) ?? 0,
          unit: 'kg',
        }))
        .filter((r) => r.value > 0);
    } else if (category === RankingCategory.REELS) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const userIds = rows.map((r) => r.user_id);
      const views = await this.prisma.reelView.groupBy({
        by: ['submissionId'],
        where: {
          viewedAt: { gte: startOfMonth },
          submission: { userId: { in: userIds } },
        },
        _count: { id: true },
      });
      const submissionOwners = await this.prisma.submission.findMany({
        where: { id: { in: views.map((v) => v.submissionId) } },
        select: { id: true, userId: true },
      });
      const ownerMap = new Map(submissionOwners.map((s) => [s.id, s.userId]));
      const viewCounts = new Map<string, number>();
      for (const v of views) {
        const owner = ownerMap.get(v.submissionId);
        if (!owner) continue;
        viewCounts.set(owner, (viewCounts.get(owner) ?? 0) + v._count.id);
      }
      scored = rows
        .map((r) => ({
          userId: r.user_id,
          name: r.name ?? undefined,
          avatarUrl: r.avatar_url ?? undefined,
          value: viewCounts.get(r.user_id) ?? 0,
          unit: 'views',
        }))
        .filter((r) => r.value > 0);
    }

    scored.sort((a, b) => b.value - a.value);
    const entries = scored.slice(0, 10).map((s, i) => ({
      rank: i + 1,
      ...s,
    }));

    let myRank: number | undefined;
    let myValue: number | undefined;
    if (userId) {
      const idx = scored.findIndex((s) => s.userId === userId);
      if (idx >= 0) {
        myRank = idx + 1;
        myValue = scored[idx].value;
      }
    }

    return { category, city, entries, myRank, myValue };
  }

  async getMyPositions(userId: string) {
    const city = await this.getUserCity(userId);
    const categories = Object.values(RankingCategory);
    const positions = [];
    for (const category of categories) {
      const result = await this.getRankings(city, category, userId);
      positions.push({
        category,
        rank: result.myRank,
        value: result.myValue,
        isTopOne: result.myRank === 1,
      });
      if (result.myRank === 1) {
        await this.prisma.userBadge.upsert({
          where: { userId_badgeType: { userId, badgeType: 'city_rank_1' } },
          create: { userId, badgeType: 'city_rank_1' },
          update: {},
        });
      }
    }
    return positions;
  }
}
