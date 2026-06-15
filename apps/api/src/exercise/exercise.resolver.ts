import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Exercise } from './exercise.model';
import { ExerciseService } from './exercise.service';
import { CreateExerciseInput } from './dto/create-exercise.input';

@Resolver(() => Exercise)
export class ExerciseResolver {
  constructor(private exerciseService: ExerciseService) {}

  @Mutation(() => Exercise)
  createExercise(@Args('input') input: CreateExerciseInput) {
    return this.exerciseService.create(input);
  }

  @Query(() => [Exercise])
  exercises() {
    return this.exerciseService.findAll();
  }
}
