import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GoalsService } from './goals.service';
import {
  CreateGoalInput,
  UpdateGoalInput,
} from './dto/goal.inputs';
import { UserGoalModel, UserMetrics } from './goal.models';

@Resolver()
export class GoalsResolver {
  constructor(private goalsService: GoalsService) {}

  @Query(() => [UserGoalModel])
  @UseGuards(JwtAuthGuard)
  myGoals(
    @CurrentUser() user: { userId: string },
    @Args('status', { nullable: true }) status?: string,
  ) {
    return this.goalsService.listGoals(user.userId, status);
  }

  @Query(() => UserMetrics)
  @UseGuards(JwtAuthGuard)
  myMetrics(@CurrentUser() user: { userId: string }) {
    return this.goalsService.getMetrics(user.userId);
  }

  @Mutation(() => UserGoalModel)
  @UseGuards(JwtAuthGuard)
  createGoal(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateGoalInput,
  ) {
    return this.goalsService.createGoal(user.userId, input);
  }

  @Mutation(() => UserGoalModel)
  @UseGuards(JwtAuthGuard)
  updateGoal(
    @CurrentUser() user: { userId: string },
    @Args('goalId', { type: () => ID }) goalId: string,
    @Args('input') input: UpdateGoalInput,
  ) {
    return this.goalsService.updateGoal(user.userId, goalId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteGoal(
    @CurrentUser() user: { userId: string },
    @Args('goalId', { type: () => ID }) goalId: string,
  ) {
    return this.goalsService.deleteGoal(user.userId, goalId);
  }
}
