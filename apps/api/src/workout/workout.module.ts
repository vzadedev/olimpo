import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutResolver } from './workout.resolver';
import { ExercisesController, ScheduleController, WorkoutPlansController } from './workout.controller';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [GoalsModule],
  providers: [WorkoutService, WorkoutResolver],
  controllers: [ExercisesController, WorkoutPlansController, ScheduleController],
  exports: [WorkoutService],
})
export class WorkoutModule {}
