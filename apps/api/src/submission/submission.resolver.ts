import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubmissionService } from './submission.service';
import { Submission } from './submission.model';
import { RankingEntry } from './ranking-entry.model';
import { ReelEntry } from './reel-entry.model';
import { CreateSubmissionInput } from './dto/create-submission.input';
import {
  CreateReelCommentInput,
  DeleteReelResult,
  ReelCommentModel,
  ReelCommentsPage,
  ReelLikeResult,
  ReelReportModel,
  ReelViewResult,
  ReportReelInput,
} from './reel.models';

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
  @UseGuards(OptionalJwtAuthGuard)
  getReels(
    @CurrentUser() user: { userId: string } | undefined,
    @Args('mineOnly', { nullable: true, defaultValue: false }) mineOnly: boolean,
  ) {
    return this.submissionService.getReels(user?.userId, mineOnly);
  }

  @Mutation(() => ReelViewResult)
  recordReelView(
    @CurrentUser() user: { userId: string } | undefined,
    @Args('submissionId', { type: () => ID }) submissionId: string,
  ) {
    return this.submissionService.recordView(submissionId, user?.userId);
  }

  @Mutation(() => DeleteReelResult)
  @UseGuards(JwtAuthGuard)
  deleteReel(
    @CurrentUser() user: { userId: string },
    @Args('submissionId', { type: () => ID }) submissionId: string,
  ) {
    return this.submissionService.deleteReel(submissionId, user.userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  reportReel(
    @CurrentUser() user: { userId: string },
    @Args('input') input: ReportReelInput,
  ) {
    return this.submissionService.reportReel(user.userId, input);
  }

  @Query(() => ReelCommentsPage)
  reelComments(
    @Args('submissionId', { type: () => ID }) submissionId: string,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ) {
    return this.submissionService.getComments(submissionId, offset, limit);
  }

  @Mutation(() => ReelCommentModel)
  @UseGuards(JwtAuthGuard)
  createReelComment(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateReelCommentInput,
  ) {
    return this.submissionService.createComment(user.userId, input);
  }

  @Mutation(() => ReelLikeResult)
  @UseGuards(JwtAuthGuard)
  toggleReelLike(
    @CurrentUser() user: { userId: string },
    @Args('submissionId', { type: () => ID }) submissionId: string,
  ) {
    return this.submissionService.toggleLike(user.userId, submissionId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteReelComment(
    @CurrentUser() user: { userId: string },
    @Args('commentId', { type: () => ID }) commentId: string,
  ) {
    return this.submissionService.deleteComment(commentId, user.userId);
  }

  @Query(() => [ReelReportModel])
  @UseGuards(JwtAuthGuard, AdminGuard)
  pendingReelReports() {
    return this.submissionService.getPendingReports();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateReelReportStatus(
    @Args('reportId', { type: () => ID }) reportId: string,
    @Args('status') status: string,
  ) {
    return this.submissionService.updateReportStatus(reportId, status);
  }
}
