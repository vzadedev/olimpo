import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CONTEST_THRESHOLD = 3;

@Injectable()
export class LiftContestService {
  constructor(private prisma: PrismaService) {}

  async contestLift(
    userId: string,
    submissionId: string,
    reason: string,
    description?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Levantamento não encontrado');
    if (submission.userId === userId) {
      throw new BadRequestException('Você não pode contestar seu próprio levantamento');
    }

    const existing = await this.prisma.liftContest.findUnique({
      where: {
        submissionId_contestantUserId: { submissionId, contestantUserId: userId },
      },
    });
    if (existing) throw new BadRequestException('Você já contestou este levantamento');

    const contest = await this.prisma.liftContest.create({
      data: {
        submissionId,
        contestantUserId: userId,
        reason,
        description,
      },
    });

    const count = await this.prisma.liftContest.count({
      where: { submissionId, status: 'pending' },
    });

    if (count >= CONTEST_THRESHOLD) {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { videoValidationStatus: 'flagged' },
      });
    }

    return contest;
  }

  async listContestsForSubmission(submissionId: string) {
    return this.prisma.liftContest.findMany({
      where: { submissionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
