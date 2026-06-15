import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { buildExerciseTitle, computeScore } from '../gamification/rank.util';

@Injectable()
export class TrainService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async getGymExercises(gymId: string, userId?: string) {
    const exercises = await this.prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      exercises.map(async (exercise) => {
        const submissions = await this.prisma.submission.findMany({
          where: { gymId, exerciseId: exercise.id },
          select: { userId: true, weight: true, reps: true },
        });

        const ranked = submissions
          .map((s) => ({
            userId: s.userId,
            score: computeScore(s.weight, s.reps),
            weight: s.weight,
          }))
          .sort((a, b) => b.score - a.score);

        const bestByUser = new Map<string, { score: number; weight: number }>();
        for (const r of ranked) {
          const current = bestByUser.get(r.userId);
          if (!current || r.score > current.score) {
            bestByUser.set(r.userId, { score: r.score, weight: r.weight });
          }
        }

        const leaderboard = [...bestByUser.entries()]
          .map(([uid, data]) => ({ userId: uid, ...data }))
          .sort((a, b) => b.score - a.score);

        const leader = leaderboard[0];
        const myEntry = userId ? leaderboard.find((e) => e.userId === userId) : undefined;
        const myRank = userId
          ? leaderboard.findIndex((e) => e.userId === userId) + 1
          : 0;

        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          myScore: myEntry?.score ?? 0,
          myRank: myRank || 0,
          myBestWeight: myEntry?.weight ?? 0,
          leaderTitle: leader ? buildExerciseTitle(exercise.name) : undefined,
        };
      }),
    );

    return results;
  }

  async getExerciseWorkouts(gymId: string, exerciseId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) return [];

    const submissions = await this.prisma.submission.findMany({
      where: { gymId, exerciseId },
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ranked = this.gamification.rankSubmissions(
      submissions.map((s) => ({ ...s, exercise })),
    );

    const bestScores = new Map<string, number>();
    for (const s of ranked) {
      const score = computeScore(s.weight, s.reps);
      const current = bestScores.get(s.userId) ?? 0;
      if (score > current) bestScores.set(s.userId, score);
    }

    const rankOrder = [...bestScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([uid], i) => ({ userId: uid, rank: i + 1 }));

    return submissions.map((s) => {
      const score = computeScore(s.weight, s.reps);
      const rank = rankOrder.find((r) => r.userId === s.userId)?.rank ?? 0;
      const isLeader = rank === 1;
      return {
        id: s.id,
        userName: s.user.name ?? s.user.email.split('@')[0],
        userEmail: s.user.email,
        weight: s.weight,
        reps: s.reps,
        score,
        rank,
        title: isLeader ? buildExerciseTitle(exercise.name) : undefined,
        createdAt: s.createdAt,
      };
    });
  }
}
