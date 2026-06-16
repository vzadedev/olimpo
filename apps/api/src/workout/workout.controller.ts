import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WorkoutService } from './workout.service';
import {
  CreateWorkoutPlanInput,
  UpdateWorkoutPlanInput,
  WorkoutPlanExerciseInput,
} from '../goals/dto/goal.inputs';

@Controller('api/exercises')
export class ExercisesController {
  constructor(private workout: WorkoutService) {}

  @Get()
  search(@Query('q') q?: string) {
    return this.workout.listExercises(q);
  }
}

@Controller('api/workout-plans')
@UseGuards(JwtHttpAuthGuard)
export class WorkoutPlansController {
  constructor(private workout: WorkoutService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.workout.listPlans(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() body: CreateWorkoutPlanInput,
  ) {
    return this.workout.createPlan(user.userId, body);
  }

  @Put(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: UpdateWorkoutPlanInput,
  ) {
    return this.workout.updatePlan(user.userId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.workout.deletePlan(user.userId, id);
  }

  @Post(':id/exercises')
  addExercise(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: WorkoutPlanExerciseInput,
  ) {
    return this.workout.addPlanExercise(user.userId, id, body);
  }

  @Put(':id/exercises/reorder')
  reorder(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.workout.reorderPlanExercises(user.userId, id, body.orderedIds);
  }
}

@Controller('api/schedule')
@UseGuards(JwtHttpAuthGuard)
export class ScheduleController {
  constructor(private workout: WorkoutService) {}

  @Get()
  calendar(
    @CurrentUser() user: { userId: string },
    @Query('month') month: string,
  ) {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    return this.workout.getCalendar(user.userId, year, m);
  }

  @Post()
  schedule(
    @CurrentUser() user: { userId: string },
    @Body() body: { planId: string; scheduledDate: string },
  ) {
    return this.workout.scheduleWorkout(user.userId, {
      planId: body.planId,
      scheduledDate: new Date(body.scheduledDate),
    });
  }

  @Patch(':id/complete')
  complete(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.workout.completeSchedule(user.userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.workout.deleteSchedule(user.userId, id);
  }
}
