import { Module } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionResolver } from './submission.resolver';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  providers: [SubmissionService, SubmissionResolver],
})
export class SubmissionModule {}
