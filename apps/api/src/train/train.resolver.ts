import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { TrainService } from './train.service';
import { GymExerciseScore, WorkoutEntry } from './train.models';
import { CurrentUser } from '../auth/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver()
export class TrainResolver {
  constructor(private trainService: TrainService) {}

  @Query(() => [GymExerciseScore])
  @UseGuards(JwtAuthGuard)
  gymExercises(
    @Args('gymId', { type: () => ID }) gymId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.trainService.getGymExercises(gymId, user.userId);
  }

  @Query(() => [WorkoutEntry])
  exerciseWorkouts(
    @Args('gymId', { type: () => ID }) gymId: string,
    @Args('exerciseId', { type: () => ID }) exerciseId: string,
  ) {
    return this.trainService.getExerciseWorkouts(gymId, exerciseId);
  }
}
