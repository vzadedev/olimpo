import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WorkoutService } from './workout.service';
import {
  CreateWorkoutPlanInput,
  ScheduleWorkoutInput,
  UpdateWorkoutPlanInput,
  WorkoutPlanExerciseInput,
} from '../goals/dto/goal.inputs';
import {
  CalendarDayModel,
  ExerciseCatalogModel,
  WorkoutPlanModel,
  WorkoutScheduleModel,
  WorkoutSessionModel,
} from './workout.models';

@Resolver()
export class WorkoutResolver {
  constructor(private workoutService: WorkoutService) {}

  @Query(() => [ExerciseCatalogModel])
  exerciseCatalog(@Args('search', { nullable: true }) search?: string) {
    return this.workoutService.listExercises(search);
  }

  @Query(() => [WorkoutPlanModel])
  @UseGuards(JwtAuthGuard)
  myWorkoutPlans(@CurrentUser() user: { userId: string }) {
    return this.workoutService.listPlans(user.userId);
  }

  @Query(() => WorkoutPlanModel)
  @UseGuards(JwtAuthGuard)
  workoutPlan(
    @CurrentUser() user: { userId: string },
    @Args('planId', { type: () => ID }) planId: string,
  ) {
    return this.workoutService.getPlan(user.userId, planId);
  }

  @Mutation(() => WorkoutPlanModel)
  @UseGuards(JwtAuthGuard)
  updateWorkoutPlan(
    @CurrentUser() user: { userId: string },
    @Args('planId', { type: () => ID }) planId: string,
    @Args('input') input: UpdateWorkoutPlanInput,
  ) {
    return this.workoutService.updatePlan(user.userId, planId, input);
  }

  @Mutation(() => WorkoutPlanModel)
  @UseGuards(JwtAuthGuard)
  createWorkoutPlan(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateWorkoutPlanInput,
  ) {
    return this.workoutService.createPlan(user.userId, input);
  }

  @Mutation(() => WorkoutPlanModel)
  @UseGuards(JwtAuthGuard)
  updateWorkoutPlanExercises(
    @CurrentUser() user: { userId: string },
    @Args('planId', { type: () => ID }) planId: string,
    @Args('exercises', { type: () => [WorkoutPlanExerciseInput] })
    exercises: WorkoutPlanExerciseInput[],
  ) {
    return this.workoutService.updatePlanExercises(user.userId, planId, exercises);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteWorkoutPlan(
    @CurrentUser() user: { userId: string },
    @Args('planId', { type: () => ID }) planId: string,
  ) {
    return this.workoutService.deletePlan(user.userId, planId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteWorkoutSchedule(
    @CurrentUser() user: { userId: string },
    @Args('scheduleId', { type: () => ID }) scheduleId: string,
  ) {
    return this.workoutService.deleteSchedule(user.userId, scheduleId);
  }

  @Mutation(() => WorkoutScheduleModel)
  @UseGuards(JwtAuthGuard)
  completeWorkoutSchedule(
    @CurrentUser() user: { userId: string },
    @Args('scheduleId', { type: () => ID }) scheduleId: string,
  ) {
    return this.workoutService.completeSchedule(user.userId, scheduleId);
  }

  @Mutation(() => WorkoutScheduleModel)
  @UseGuards(JwtAuthGuard)
  scheduleWorkout(
    @CurrentUser() user: { userId: string },
    @Args('input') input: ScheduleWorkoutInput,
  ) {
    return this.workoutService.scheduleWorkout(user.userId, input);
  }

  @Query(() => [CalendarDayModel])
  @UseGuards(JwtAuthGuard)
  workoutCalendar(
    @CurrentUser() user: { userId: string },
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
  ) {
    return this.workoutService
      .getCalendar(user.userId, year, month)
      .then((r) => r.days);
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  workoutStreak(@CurrentUser() user: { userId: string }) {
    return this.workoutService
      .getCalendar(user.userId, new Date().getFullYear(), new Date().getMonth() + 1)
      .then((r) => r.streak);
  }

  @Query(() => [WorkoutScheduleModel])
  @UseGuards(JwtAuthGuard)
  schedulesForDate(
    @CurrentUser() user: { userId: string },
    @Args('date') date: string,
  ) {
    return this.workoutService.getSchedulesForDate(user.userId, date);
  }

  @Mutation(() => WorkoutSessionModel)
  @UseGuards(JwtAuthGuard)
  startWorkoutSession(
    @CurrentUser() user: { userId: string },
    @Args('planId', { type: () => ID }) planId: string,
    @Args('scheduleId', { type: () => ID, nullable: true }) scheduleId?: string,
  ) {
    return this.workoutService.startSession(user.userId, planId, scheduleId);
  }

  @Mutation(() => WorkoutSessionModel)
  @UseGuards(JwtAuthGuard)
  completeWorkoutSet(
    @CurrentUser() user: { userId: string },
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('planExerciseId', { type: () => ID }) planExerciseId: string,
    @Args('setNumber', { type: () => Int }) setNumber: number,
  ) {
    return this.workoutService.completeSet(
      user.userId,
      sessionId,
      planExerciseId,
      setNumber,
    );
  }

  @Query(() => WorkoutSessionModel)
  @UseGuards(JwtAuthGuard)
  workoutSession(
    @CurrentUser() user: { userId: string },
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ) {
    return this.workoutService.getSession(user.userId, sessionId);
  }
}
