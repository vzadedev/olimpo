import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { computeScore } from '../gamification/rank.util';
import {
  CreateGoalInput,
  UpdateGoalInput,
} from './dto/goal.inputs';
import { UserBadge, UserGoalModel, UserMetrics } from './goal.models';

const BADGE_META: Record<string, { title: string; description: string }> = {
  first_lift: { title: 'Primeiro levantamento', description: 'Registrou seu primeiro levantamento' },
  streak_7: { title: 'Sequência de 7 dias', description: 'Treinou 7 dias seguidos' },
  lifts_100: { title: '100 treinos', description: 'Completou 100 treinos registrados' },
  city_rank_1: { title: 'Rei da cidade', description: '#1 em alguma categoria da cidade' },
  battle_winner: { title: 'Vencedor de duelo', description: 'Venceu um duelo de PR' },
};

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private mapGoal(
    g: {
      id: string;
      title: string;
      description: string | null;
      targetValue: number;
      currentValue: number;
      unit: string;
      exerciseId: string | null;
      deadline: Date | null;
      status: string;
      completedAt: Date | null;
      createdAt: Date;
      exercise?: { name: string } | null;
    },
  ): UserGoalModel {
    const progressPercent =
      g.targetValue > 0
        ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
        : 0;
    return {
      id: g.id,
      title: g.title,
      description: g.description ?? undefined,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      unit: g.unit,
      exerciseId: g.exerciseId ?? undefined,
      exerciseName: g.exercise?.name,
      deadline: g.deadline ?? undefined,
      status: g.status,
      completedAt: g.completedAt ?? undefined,
      createdAt: g.createdAt,
      progressPercent,
    };
  }

  async listGoals(userId: string, status?: string) {
    const goals = await this.prisma.userGoal.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { exercise: { select: { name: true } } },
    });
    return goals.map((g) => this.mapGoal(g));
  }

  async createGoal(userId: string, input: CreateGoalInput) {
    const goal = await this.prisma.userGoal.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        targetValue: input.targetValue,
        unit: input.unit,
        exerciseId: input.exerciseId,
        deadline: input.deadline,
      },
      include: { exercise: { select: { name: true } } },
    });
    return this.mapGoal(goal);
  }

  async updateGoal(userId: string, goalId: string, input: UpdateGoalInput) {
    const goal = await this.prisma.userGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('Objetivo não encontrado');

    const updated = await this.prisma.userGoal.update({
      where: { id: goalId },
      data: {
        title: input.title,
        description: input.description,
        targetValue: input.targetValue,
        unit: input.unit,
        status: input.status,
        completedAt:
          input.status === 'completed' ? new Date() : goal.completedAt,
      },
      include: { exercise: { select: { name: true } } },
    });
    return this.mapGoal(updated);
  }

  async deleteGoal(userId: string, goalId: string) {
    const goal = await this.prisma.userGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('Objetivo não encontrado');
    await this.prisma.userGoal.delete({ where: { id: goalId } });
    return true;
  }

  async checkGoalsAfterSubmission(
    userId: string,
    exerciseId: string,
    weight: number,
    reps: number,
  ) {
    const goals = await this.prisma.userGoal.findMany({
      where: {
        userId,
        status: 'in_progress',
        OR: [{ exerciseId: null }, { exerciseId }],
      },
    });

    for (const goal of goals) {
      let currentValue = goal.currentValue;
      if (goal.unit === 'kg' && goal.exerciseId === exerciseId) {
        currentValue = Math.max(currentValue, weight);
      } else if (goal.unit === 'reps' && goal.exerciseId === exerciseId) {
        currentValue = Math.max(currentValue, reps);
      } else if (goal.unit === 'pts' && goal.exerciseId === exerciseId) {
        currentValue = Math.max(currentValue, computeScore(weight, reps));
      } else if (goal.unit === 'treinos') {
        currentValue += 1;
      }

      const completed = currentValue >= goal.targetValue;
      const wasCompleted = goal.status === 'completed';
      await this.prisma.userGoal.update({
        where: { id: goal.id },
        data: {
          currentValue,
          status: completed ? 'completed' : 'in_progress',
          completedAt: completed ? new Date() : null,
        },
      });
      if (completed && !wasCompleted) {
        await this.notifications.create({
          userId,
          type: 'goal_completed',
          referenceId: goal.id,
          referenceType: 'goal',
        });
      }
    }
  }

  async awardBadge(userId: string, badgeType: string) {
    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_badgeType: { userId, badgeType } },
    });
    if (existing) return existing;

    const badge = await this.prisma.userBadge.create({
      data: { userId, badgeType },
    });
    await this.notifications.create({
      userId,
      type: 'badge_earned',
      referenceId: badge.id,
      referenceType: 'badge',
    });
    return badge;
  }

  async evaluateBadges(userId: string) {
    const submissions = await this.prisma.submission.count({ where: { userId } });
    if (submissions >= 1) await this.awardBadge(userId, 'first_lift');
    if (submissions >= 100) await this.awardBadge(userId, 'lifts_100');

    const completedSchedules = await this.prisma.workoutSchedule.findMany({
      where: { userId, completed: true },
      orderBy: { scheduledDate: 'desc' },
    });
    const days = new Set(
      completedSchedules.map((s) => s.scheduledDate.toISOString().slice(0, 10)),
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
    if (streak >= 7) await this.awardBadge(userId, 'streak_7');
  }

  async listBadges(userId: string) {
    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
    return badges.map((b) => ({
      id: b.badgeType,
      title: BADGE_META[b.badgeType]?.title ?? b.badgeType,
      description: BADGE_META[b.badgeType]?.description ?? '',
      earnedAt: b.earnedAt,
    }));
  }

  async getMetrics(userId: string): Promise<UserMetrics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const submissions = await this.prisma.submission.findMany({
      where: { userId },
      include: { exercise: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const submissionsThisMonth = submissions.filter(
      (s) => s.createdAt >= monthStart,
    ).length;

    const maxByExercise = new Map<string, number>();
    for (const s of submissions) {
      const current = maxByExercise.get(s.exercise.name) ?? 0;
      if (s.weight > current) maxByExercise.set(s.exercise.name, s.weight);
    }

    const daySet = new Set(
      submissions.map((s) => s.createdAt.toISOString().slice(0, 10)),
    );
    const sortedDays = [...daySet].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    const today = now.toISOString().slice(0, 10);
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const key = checkDate.toISOString().slice(0, 10);
      if (daySet.has(key)) {
        streak += 1;
        if (i === 0 || currentStreak > 0) currentStreak = streak;
      } else if (i === 0) {
        streak = 0;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (const day of sortedDays) {
      // simple longest streak calc
    }
    longestStreak = Math.max(currentStreak, streak, sortedDays.length > 0 ? 1 : 0);
    if (sortedDays.length >= 2) {
      let run = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff === 1) run += 1;
        else run = 1;
        longestStreak = Math.max(longestStreak, run);
      }
    }

    const weeklyProgress = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(start.getDate() - (w + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - w * 7);
      const weekSubs = submissions.filter(
        (s) => s.createdAt >= start && s.createdAt < end,
      );
      weeklyProgress.push({
        weekLabel: `Sem ${4 - w}`,
        submissions: weekSubs.length,
        totalVolume: weekSubs.reduce((acc, s) => acc + s.weight * s.reps, 0),
      });
    }

    const totalSubs = submissions.length;
    const persistedBadges = await this.listBadges(userId);
    const badges: UserBadge[] = persistedBadges.length
      ? persistedBadges
      : [];
    if (badges.length === 0) {
      if (totalSubs >= 1) {
        badges.push({
          id: 'first_lift',
          title: 'Primeiro levantamento',
          description: 'Registrou seu primeiro levantamento',
          earnedAt: submissions[0]?.createdAt,
        });
      }
    }

    const completedGoals = await this.listGoals(userId, 'completed');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { weightKg: true, heightCm: true },
    });
    const bodyLogs = await this.prisma.userBodyMetricLog.findMany({
      where: { userId },
      orderBy: { recordedAt: 'asc' },
      take: 30,
    });
    const currentBmi =
      user?.weightKg && user?.heightCm
        ? Math.round((user.weightKg / ((user.heightCm / 100) ** 2)) * 10) / 10
        : undefined;

    return {
      submissionsThisMonth,
      currentStreak,
      longestStreak,
      maxWeightByExercise: [...maxByExercise.entries()].map(
        ([exerciseName, maxWeight]) => ({ exerciseName, maxWeight }),
      ),
      weeklyProgress,
      badges,
      completedGoals,
      currentWeightKg: user?.weightKg ?? undefined,
      currentHeightCm: user?.heightCm ?? undefined,
      currentBmi,
      bodyMetricHistory: bodyLogs.map((l) => ({
        recordedAt: l.recordedAt,
        weightKg: l.weightKg,
        heightCm: l.heightCm ?? undefined,
        bmi: l.bmi,
      })),
    };
  }
}
