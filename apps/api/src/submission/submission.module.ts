import { Module } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionResolver } from './submission.resolver';
import { VideoValidationService } from './video-validation.service';
import { LiftContestService } from './lift-contest.service';
import { LiftsController } from './lifts.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { GoalsModule } from '../goals/goals.module';
import { BattlesModule } from '../battles/battles.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [GamificationModule, GoalsModule, BattlesModule, AuthModule],
  providers: [SubmissionService, SubmissionResolver, VideoValidationService, LiftContestService],
  controllers: [LiftsController],
  exports: [SubmissionService, VideoValidationService],
})
export class SubmissionModule {}
