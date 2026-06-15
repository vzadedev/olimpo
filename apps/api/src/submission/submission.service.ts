import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { distanceInMeters } from '../common/geo.util';
import { buildExerciseTitle, computeScore } from '../gamification/rank.util';
import { CreateSubmissionInput } from './dto/create-submission.input';

const MAX_DISTANCE_METERS = 100;

@Injectable()
export class SubmissionService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async create(userId: string, input: CreateSubmissionInput) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: input.gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const distance = distanceInMeters(
      input.latitude,
      input.longitude,
      gym.latitude,
      gym.longitude,
    );

    if (distance > MAX_DISTANCE_METERS) {
      throw new BadRequestException(
        `You must be within ${MAX_DISTANCE_METERS}m of the gym to submit (currently ${Math.round(distance)}m away)`,
      );
    }

    return this.prisma.submission.create({
      data: {
        weight: input.weight,
        reps: input.reps,
        videoUrl: input.videoUrl,
        gymId: input.gymId,
        exerciseId: input.exerciseId,
        userId,
        createdUserId: userId,
        updatedUserId: userId,
      },
    });
  }

  async getRanking(gymId: string, exerciseId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    const submissions = await this.prisma.submission.findMany({
      where: { gymId, exerciseId },
      include: { user: { select: { email: true, name: true } } },
    });

    const bestByUser = new Map<
      string,
      (typeof submissions)[0] & { score: number }
    >();

    for (const s of submissions) {
      const score = computeScore(s.weight, s.reps);
      const current = bestByUser.get(s.userId);
      if (!current || score > current.score) {
        bestByUser.set(s.userId, { ...s, score });
      }
    }

    const ranked = [...bestByUser.values()].sort((a, b) => b.score - a.score);

    return ranked.slice(0, 10).map((s, index) => ({
      id: s.id,
      weight: s.weight,
      reps: s.reps,
      score: s.score,
      rank: index + 1,
      videoUrl: s.videoUrl,
      createdAt: s.createdAt,
      userEmail: s.user.email,
      userName: s.user.name ?? undefined,
      title:
        index === 0 && exercise
          ? buildExerciseTitle(exercise.name)
          : undefined,
    }));
  }

  async getReels() {
    const submissions = await this.prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            instagramUsername: true,
          },
        },
        exercise: { select: { name: true } },
        gym: { select: { name: true } },
      },
    });

    return submissions.map((s) => ({
      id: s.id,
      videoUrl: s.videoUrl,
      weight: s.weight,
      createdAt: s.createdAt,
      userEmail: s.user.email,
      userName: s.user.name ?? undefined,
      instagramUsername: s.user.instagramUsername ?? undefined,
      exerciseName: s.exercise.name,
      gymName: s.gym.name,
    }));
  }
}
