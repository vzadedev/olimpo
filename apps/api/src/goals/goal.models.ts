import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserGoalModel {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  targetValue: number;

  @Field(() => Float)
  currentValue: number;

  @Field()
  unit: string;

  @Field(() => ID, { nullable: true })
  exerciseId?: string;

  @Field({ nullable: true })
  exerciseName?: string;

  @Field({ nullable: true })
  deadline?: Date;

  @Field()
  status: string;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field()
  createdAt: Date;

  @Field(() => Int)
  progressPercent: number;
}

@ObjectType()
export class UserBadge {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  earnedAt?: Date;
}

@ObjectType()
export class ExerciseMaxWeight {
  @Field()
  exerciseName: string;

  @Field(() => Float)
  maxWeight: number;
}

@ObjectType()
export class WeeklyProgressPoint {
  @Field()
  weekLabel: string;

  @Field(() => Int)
  submissions: number;

  @Field(() => Float)
  totalVolume: number;
}

@ObjectType()
export class BodyMetricPoint {
  @Field()
  recordedAt: Date;

  @Field(() => Float)
  weightKg: number;

  @Field(() => Float, { nullable: true })
  heightCm?: number;

  @Field(() => Float)
  bmi: number;
}

@ObjectType()
export class UserMetrics {
  @Field(() => Int)
  submissionsThisMonth: number;

  @Field(() => Int)
  currentStreak: number;

  @Field(() => Int)
  longestStreak: number;

  @Field(() => [ExerciseMaxWeight])
  maxWeightByExercise: ExerciseMaxWeight[];

  @Field(() => [WeeklyProgressPoint])
  weeklyProgress: WeeklyProgressPoint[];

  @Field(() => [UserBadge])
  badges: UserBadge[];

  @Field(() => [UserGoalModel])
  completedGoals: UserGoalModel[];

  @Field(() => Float, { nullable: true })
  currentWeightKg?: number;

  @Field(() => Float, { nullable: true })
  currentHeightCm?: number;

  @Field(() => Float, { nullable: true })
  currentBmi?: number;

  @Field(() => [BodyMetricPoint])
  bodyMetricHistory: BodyMetricPoint[];
}
