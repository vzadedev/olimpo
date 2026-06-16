import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WorkoutPlanExerciseModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  exerciseId: string;

  @Field()
  exerciseName: string;

  @Field({ nullable: true })
  muscleGroup?: string;

  @Field(() => Int)
  sets: number;

  @Field(() => Int)
  reps: number;

  @Field(() => Float, { nullable: true })
  suggestedWeight?: number;

  @Field(() => Int)
  restSeconds: number;

  @Field(() => Int)
  orderIndex: number;
}

@ObjectType()
export class WorkoutPlanModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt: Date;

  @Field(() => [WorkoutPlanExerciseModel])
  exercises: WorkoutPlanExerciseModel[];
}

@ObjectType()
export class WorkoutScheduleModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  planId: string;

  @Field()
  planName: string;

  @Field()
  scheduledDate: Date;

  @Field()
  completed: boolean;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field()
  status: string;
}

@ObjectType()
export class WorkoutSessionSetModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  planExerciseId: string;

  @Field()
  exerciseName: string;

  @Field(() => Int)
  setNumber: number;

  @Field()
  completed: boolean;

  @Field(() => Int, { nullable: true })
  reps?: number;

  @Field(() => Float, { nullable: true })
  suggestedWeight?: number;

  @Field(() => Int, { nullable: true })
  restSeconds?: number;
}

@ObjectType()
export class WorkoutSessionModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  planId: string;

  @Field()
  planName: string;

  @Field()
  startedAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => [WorkoutSessionSetModel])
  sets: WorkoutSessionSetModel[];
}

@ObjectType()
export class CalendarDayIndicatorModel {
  @Field()
  planName: string;

  @Field()
  status: string;
}

@ObjectType()
export class CalendarDayModel {
  @Field()
  date: string;

  @Field(() => Int)
  scheduledCount: number;

  @Field(() => Int)
  completedCount: number;

  @Field(() => Int)
  missedCount: number;

  @Field()
  status: string;

  @Field(() => [CalendarDayIndicatorModel])
  indicators: CalendarDayIndicatorModel[];
}

@ObjectType()
export class ExerciseCatalogModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  muscleGroup?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isDefault: boolean;
}
