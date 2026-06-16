import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  DietAnalysisResultModel,
  DietDashboardModel,
  DietDaySummaryModel,
  DietPlanModel,
  MealModel,
  UserDietGoalModel,
} from './diet.models';
import {
  AnalyzeMealInput,
  CreateDietPlanInput,
  CreateMealInput,
  UpdateDietGoalInput,
} from './dto/diet.input';
import { DietService } from './diet.service';

@Resolver()
export class DietResolver {
  constructor(private diet: DietService) {}

  @Query(() => DietDashboardModel)
  @UseGuards(JwtAuthGuard)
  dietDashboard(
    @CurrentUser() user: { userId: string },
    @Args('date', { nullable: true }) date?: string,
  ) {
    return this.diet.getDashboard(user.userId, date);
  }

  @Query(() => [DietDaySummaryModel])
  @UseGuards(JwtAuthGuard)
  dietWeeklySummary(@CurrentUser() user: { userId: string }) {
    return this.diet.getWeeklySummary(user.userId);
  }

  @Query(() => UserDietGoalModel, { nullable: true })
  @UseGuards(JwtAuthGuard)
  myDietGoal(@CurrentUser() user: { userId: string }) {
    return this.diet.getGoal(user.userId);
  }

  @Mutation(() => UserDietGoalModel)
  @UseGuards(JwtAuthGuard)
  updateDietGoal(
    @CurrentUser() user: { userId: string },
    @Args('input') input: UpdateDietGoalInput,
  ) {
    return this.diet.upsertGoal(user.userId, input);
  }

  @Mutation(() => UserDietGoalModel)
  @UseGuards(JwtAuthGuard)
  suggestDietGoal(
    @CurrentUser() user: { userId: string },
    @Args('objective') objective: string,
  ) {
    const suggested = this.diet.suggestGoal(objective);
    return this.diet.upsertGoal(user.userId, suggested);
  }

  @Mutation(() => UserDietGoalModel)
  @UseGuards(JwtAuthGuard)
  suggestDietGoalWithAI(
    @CurrentUser() user: { userId: string },
    @Args('objective') objective: string,
  ) {
    return this.diet.suggestGoalWithAI(user.userId, objective);
  }

  @Query(() => [DietPlanModel])
  @UseGuards(JwtAuthGuard)
  myDietPlans(@CurrentUser() user: { userId: string }) {
    return this.diet.listPlans(user.userId);
  }

  @Query(() => DietPlanModel, { nullable: true })
  @UseGuards(JwtAuthGuard)
  activeDietPlan(@CurrentUser() user: { userId: string }) {
    return this.diet.activePlan(user.userId);
  }

  @Mutation(() => DietPlanModel)
  @UseGuards(JwtAuthGuard)
  createDietPlan(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateDietPlanInput,
  ) {
    return this.diet.createPlan(user.userId, input);
  }

  @Mutation(() => DietPlanModel, { nullable: true })
  @UseGuards(JwtAuthGuard)
  activateDietPlan(
    @CurrentUser() user: { userId: string },
    @Args('planId', { type: () => ID }) planId: string,
  ) {
    return this.diet.activatePlan(user.userId, planId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteDietPlan(
    @CurrentUser() user: { userId: string },
    @Args('planId', { type: () => ID }) planId: string,
  ) {
    return this.diet.deletePlan(user.userId, planId);
  }

  @Mutation(() => MealModel)
  @UseGuards(JwtAuthGuard)
  createMeal(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateMealInput,
  ) {
    return this.diet.createMeal(user.userId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteMeal(
    @CurrentUser() user: { userId: string },
    @Args('mealId', { type: () => ID }) mealId: string,
  ) {
    return this.diet.deleteMeal(user.userId, mealId);
  }

  @Mutation(() => DietAnalysisResultModel)
  @UseGuards(JwtAuthGuard)
  analyzeMealPhoto(
    @CurrentUser() user: { userId: string },
    @Args('input') input: AnalyzeMealInput,
  ) {
    return this.diet.analyzeImage(
      user.userId,
      input.imageBase64,
      input.mediaType,
    );
  }
}
