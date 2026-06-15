import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Submission } from './submission.model';
import { RankingEntry } from './ranking-entry.model';
import { ReelEntry } from './reel-entry.model';
import { SubmissionService } from './submission.service';
import { CreateSubmissionInput } from './dto/create-submission.input';

@Resolver(() => Submission)
export class SubmissionResolver {
  constructor(private submissionService: SubmissionService) {}

  @Mutation(() => Submission)
  @UseGuards(JwtAuthGuard)
  createSubmission(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateSubmissionInput,
  ) {
    return this.submissionService.create(user.userId, input);
  }

  @Query(() => [RankingEntry])
  getRanking(
    @Args('gymId', { type: () => ID }) gymId: string,
    @Args('exerciseId', { type: () => ID }) exerciseId: string,
  ) {
    return this.submissionService.getRanking(gymId, exerciseId);
  }

  @Query(() => [ReelEntry])
  getReels() {
    return this.submissionService.getReels();
  }
}
