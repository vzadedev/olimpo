import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { GoalsService } from '../goals/goals.service';
import { BattlesService } from '../battles/battles.service';
import { MAX_DISTANCE_METERS } from '../common/constants';
import { distanceInMeters } from '../common/geo.util';
import { buildExerciseTitle, computeScore } from '../gamification/rank.util';
import { CreateSubmissionInput } from './dto/create-submission.input';
import {
  CreateReelCommentInput,
  ReportReelInput,
} from './reel.models';

const VIEW_COOLDOWN_MS = 30_000;

@Injectable()
export class SubmissionService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private goalsService: GoalsService,
    private battlesService: BattlesService,
  ) {}

  async create(userId: string, input: CreateSubmissionInput) {
    if (!input.gymId || !input.exerciseId) {
      throw new BadRequestException('Academia e exercício são obrigatórios');
    }

    const gym = await this.prisma.gym.findUnique({
      where: { id: input.gymId },
    });

    if (!gym) {
      throw new NotFoundException('Academia não encontrada');
    }

    const distance = distanceInMeters(
      input.latitude,
      input.longitude,
      gym.latitude,
      gym.longitude,
    );

    if (distance > MAX_DISTANCE_METERS) {
      throw new BadRequestException(
        `Você está a ${Math.round(distance)} metros da academia. Aproxime-se para registrar o levantamento.`,
      );
    }

    const submission = await this.prisma.submission.create({
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

    await this.goalsService.checkGoalsAfterSubmission(
      userId,
      input.exerciseId,
      input.weight,
      input.reps,
    );
    await this.goalsService.evaluateBadges(userId);
    await this.battlesService.recordSubmissionForBattles(
      userId,
      input.exerciseId,
      input.weight,
      input.reps,
      submission.id,
    );

    return submission;
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

  private mapReel(
    s: {
      id: string;
      videoUrl: string;
      weight: number;
      createdAt: Date;
      userId: string;
      user: {
        email: string;
        name: string | null;
        instagramUsername: string | null;
      };
      exercise: { name: string };
      gym: { name: string };
      _count: { views: number; comments: number; likes: number };
      likes?: { userId: string }[];
    },
    currentUserId?: string,
  ) {
    return {
      id: s.id,
      videoUrl: s.videoUrl,
      weight: s.weight,
      createdAt: s.createdAt,
      userId: s.userId,
      userEmail: s.user.email,
      userName: s.user.name ?? undefined,
      instagramUsername: s.user.instagramUsername ?? undefined,
      exerciseName: s.exercise.name,
      gymName: s.gym.name,
      viewCount: s._count.views,
      commentCount: s._count.comments,
      likeCount: s._count.likes,
      likedByMe: currentUserId
        ? (s.likes ?? []).some((l) => l.userId === currentUserId)
        : false,
      isOwner: currentUserId ? s.userId === currentUserId : false,
    };
  }

  async getReels(userId?: string, mineOnly = false) {
    const submissions = await this.prisma.submission.findMany({
      where: mineOnly && userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: mineOnly ? 100 : 50,
      include: {
        user: {
          select: { email: true, name: true, instagramUsername: true },
        },
        exercise: { select: { name: true } },
        gym: { select: { name: true } },
        _count: { select: { views: true, comments: true, likes: true } },
        likes: userId
          ? { where: { userId }, select: { userId: true } }
          : false,
      },
    });

    return submissions.map((s) => this.mapReel(s, userId));
  }

  async recordView(submissionId: string, userId?: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) {
      throw new NotFoundException('Reel não encontrado');
    }

    const cooldownSince = new Date(Date.now() - VIEW_COOLDOWN_MS);
    if (userId) {
      const recent = await this.prisma.reelView.findFirst({
        where: {
          submissionId,
          userId,
          viewedAt: { gte: cooldownSince },
        },
      });
      if (recent) {
        const viewCount = await this.prisma.reelView.count({
          where: { submissionId },
        });
        return { counted: false, viewCount };
      }
    }

    await this.prisma.reelView.create({
      data: { submissionId, userId: userId ?? null },
    });

    const viewCount = await this.prisma.reelView.count({
      where: { submissionId },
    });
    return { counted: true, viewCount };
  }

  async deleteReel(submissionId: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) {
      throw new NotFoundException('Reel não encontrado');
    }
    if (submission.userId !== userId) {
      throw new ForbiddenException('Você só pode excluir seus próprios vídeos');
    }

    await this.prisma.submission.delete({ where: { id: submissionId } });
    return { success: true };
  }

  async reportReel(userId: string, input: ReportReelInput) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: input.submissionId },
    });
    if (!submission) {
      throw new NotFoundException('Reel não encontrado');
    }

    try {
      await this.prisma.reelReport.create({
        data: {
          submissionId: input.submissionId,
          reporterUserId: userId,
          reason: input.reason,
          description: input.description,
        },
      });
      return true;
    } catch {
      throw new BadRequestException('Você já denunciou este vídeo');
    }
  }

  async toggleLike(userId: string, submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Reel não encontrado');

    const existing = await this.prisma.reelLike.findUnique({
      where: { submissionId_userId: { submissionId, userId } },
    });

    if (existing) {
      await this.prisma.reelLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reelLike.create({ data: { submissionId, userId } });
    }

    const likeCount = await this.prisma.reelLike.count({ where: { submissionId } });
    return { liked: !existing, likeCount };
  }

  async getComments(submissionId: string, offset = 0, limit = 20) {
    const total = await this.prisma.reelComment.count({
      where: { submissionId, parentId: null },
    });

    const roots = await this.prisma.reelComment.findMany({
      where: { submissionId, parentId: null },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const mapComment = (c: {
      id: string;
      text: string;
      userId: string;
      parentId: string | null;
      createdAt: Date;
      user: { id: string; name: string | null; email: string };
      replies?: Array<{
        id: string;
        text: string;
        userId: string;
        parentId: string | null;
        createdAt: Date;
        user: { id: string; name: string | null; email: string };
      }>;
    }) => ({
      id: c.id,
      text: c.text,
      userId: c.userId,
      userName: c.user.name ?? c.user.email.split('@')[0],
      parentId: c.parentId ?? undefined,
      createdAt: c.createdAt,
      replies: c.replies?.map((r) => ({
        id: r.id,
        text: r.text,
        userId: r.userId,
        userName: r.user.name ?? r.user.email.split('@')[0],
        parentId: r.parentId ?? undefined,
        createdAt: r.createdAt,
      })),
    });

    return {
      items: roots.map(mapComment),
      hasMore: offset + limit < total,
      total,
    };
  }

  async createComment(userId: string, input: CreateReelCommentInput) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: input.submissionId },
    });
    if (!submission) {
      throw new NotFoundException('Reel não encontrado');
    }

    if (input.parentId) {
      const parent = await this.prisma.reelComment.findUnique({
        where: { id: input.parentId },
      });
      if (!parent || parent.submissionId !== input.submissionId) {
        throw new BadRequestException('Comentário pai inválido');
      }
      if (parent.parentId) {
        throw new BadRequestException('Respostas aninhadas limitadas a 1 nível');
      }
    }

    const comment = await this.prisma.reelComment.create({
      data: {
        submissionId: input.submissionId,
        userId,
        parentId: input.parentId,
        text: input.text.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: comment.id,
      text: comment.text,
      userId: comment.userId,
      userName: comment.user.name ?? comment.user.email.split('@')[0],
      parentId: comment.parentId ?? undefined,
      createdAt: comment.createdAt,
    };
  }

  async deleteComment(commentId: string, userId: string, isAdmin = false) {
    const comment = await this.prisma.reelComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Sem permissão para excluir');
    }

    await this.prisma.reelComment.delete({ where: { id: commentId } });
    return true;
  }

  async getPendingReports() {
    const reports = await this.prisma.reelReport.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { name: true, email: true } },
        submission: { include: { exercise: { select: { name: true } } } },
      },
    });

    return reports.map((r) => ({
      id: r.id,
      submissionId: r.submissionId,
      reason: r.reason,
      description: r.description ?? undefined,
      status: r.status,
      reporterName: r.reporter.name ?? r.reporter.email.split('@')[0],
      reelExerciseName: r.submission.exercise.name,
      createdAt: r.createdAt,
    }));
  }

  async updateReportStatus(reportId: string, status: string) {
    await this.prisma.reelReport.update({
      where: { id: reportId },
      data: { status },
    });
    return true;
  }
}
