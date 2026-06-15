import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildExerciseTitle,
  computeGlobalRank,
  computeScore,
} from '../gamification/rank.util';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async getUserGlobalStats(userId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { userId },
      select: { exerciseId: true, gymId: true, weight: true, reps: true },
    });

    const bestByExerciseGym = new Map<string, number>();
    for (const s of submissions) {
      const key = `${s.gymId}:${s.exerciseId}`;
      const score = computeScore(s.weight, s.reps);
      const current = bestByExerciseGym.get(key) ?? 0;
      if (score > current) bestByExerciseGym.set(key, score);
    }

    const globalScore = [...bestByExerciseGym.values()].reduce((a, b) => a + b, 0);
    return {
      globalScore,
      globalRank: computeGlobalRank(globalScore),
    };
  }

  async getUserExerciseTitles(userId: string) {
    const exercises = await this.prisma.exercise.findMany();
    const gyms = await this.prisma.gym.findMany();
    const titles: {
      gymId: string;
      gymName: string;
      exerciseId: string;
      exerciseName: string;
      title: string;
    }[] = [];

    for (const gym of gyms) {
      for (const exercise of exercises) {
        const leader = await this.getExerciseLeader(gym.id, exercise.id);
        if (leader?.userId === userId) {
          titles.push({
            gymId: gym.id,
            gymName: gym.name,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            title: buildExerciseTitle(exercise.name),
          });
        }
      }
    }

    return titles;
  }

  async getExerciseLeader(gymId: string, exerciseId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { gymId, exerciseId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: [{ weight: 'desc' }, { reps: 'desc' }],
    });

    if (!submissions.length) return null;

    const best = submissions.reduce((top, s) => {
      const score = computeScore(s.weight, s.reps);
      const topScore = computeScore(top.weight, top.reps);
      return score > topScore ? s : top;
    });

    return {
      userId: best.userId,
      userEmail: best.user.email,
      userName: best.user.name,
      weight: best.weight,
      reps: best.reps,
      score: computeScore(best.weight, best.reps),
    };
  }

  rankSubmissions<
    T extends { userId: string; weight: number; reps: number; user: { email: string; name: string | null } },
  >(submissions: T[]) {
    const sorted = [...submissions].sort((a, b) => {
      const scoreA = computeScore(a.weight, a.reps);
      const scoreB = computeScore(b.weight, b.reps);
      return scoreB - scoreA;
    });

    return sorted.map((s, index) => ({
      ...s,
      rank: index + 1,
      score: computeScore(s.weight, s.reps),
      title: index === 0 ? buildExerciseTitle((s as T & { exercise?: { name: string } }).exercise?.name ?? '') : undefined,
    }));
  }
}
