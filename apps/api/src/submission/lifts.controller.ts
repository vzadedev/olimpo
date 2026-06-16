import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { VideoValidationService } from './video-validation.service';
import { LiftContestService } from './lift-contest.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/lifts')
@UseGuards(JwtHttpAuthGuard)
export class LiftsController {
  constructor(
    private videoValidation: VideoValidationService,
    private liftContest: LiftContestService,
    private prisma: PrismaService,
  ) {}

  @Post('validate-video')
  async validateVideo(
    @CurrentUser() user: { userId: string },
    @Body()
    body: {
      submissionId: string;
      declaredWeightKg: number;
      exerciseName: string;
      frames: string[];
    },
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: body.submissionId },
      include: { exercise: { select: { name: true } } },
    });
    if (!submission) throw new NotFoundException('Levantamento não encontrado');
    if (submission.userId !== user.userId) throw new ForbiddenException('Sem permissão');

    return this.videoValidation.validateSubmissionVideo(
      body.submissionId,
      body.declaredWeightKg ?? submission.weight,
      body.exerciseName ?? submission.exercise.name,
      body.frames,
    );
  }

  @Post(':id/contest')
  contest(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: { reason: string; description?: string },
  ) {
    return this.liftContest.contestLift(user.userId, id, body.reason, body.description);
  }

  @Get(':id/contests')
  listContests(@Param('id') id: string) {
    return this.liftContest.listContestsForSubmission(id);
  }
}
