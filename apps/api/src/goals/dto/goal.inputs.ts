import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateGoalInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  targetValue: number;

  @Field()
  unit: string;

  @Field(() => ID, { nullable: true })
  exerciseId?: string;

  @Field({ nullable: true })
  deadline?: Date;
}

@InputType()
export class UpdateGoalInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  targetValue?: number;

  @Field({ nullable: true })
  unit?: string;

  @Field({ nullable: true })
  status?: string;
}

@InputType()
export class UpdateWorkoutPlanInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class CreateWorkoutPlanInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class WorkoutPlanExerciseInput {
  @Field(() => ID)
  exerciseId: string;

  @Field(() => Int, { defaultValue: 3 })
  sets: number;

  @Field(() => Int, { defaultValue: 10 })
  reps: number;

  @Field(() => Float, { nullable: true })
  suggestedWeight?: number;

  @Field(() => Int, { defaultValue: 60 })
  restSeconds: number;

  @Field(() => Int, { defaultValue: 0 })
  orderIndex: number;
}

@InputType()
export class ScheduleWorkoutInput {
  @Field(() => ID)
  planId: string;

  @Field()
  scheduledDate: Date;
}

@InputType()
export class CompleteSessionSetInput {
  @Field(() => ID)
  sessionId: string;

  @Field(() => ID)
  planExerciseId: string;

  @Field(() => Int)
  setNumber: number;
}
