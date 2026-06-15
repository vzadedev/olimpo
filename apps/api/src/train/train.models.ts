import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GymExerciseScore {
  @Field(() => ID)
  exerciseId: string;

  @Field()
  exerciseName: string;

  @Field(() => Int)
  myScore: number;

  @Field(() => Int)
  myRank: number;

  @Field(() => Float)
  myBestWeight: number;

  @Field({ nullable: true })
  leaderTitle?: string;
}

@ObjectType()
export class WorkoutEntry {
  @Field(() => ID)
  id: string;

  @Field()
  userName: string;

  @Field()
  userEmail: string;

  @Field(() => Float)
  weight: number;

  @Field(() => Int)
  reps: number;

  @Field(() => Int)
  score: number;

  @Field(() => Int)
  rank: number;

  @Field({ nullable: true })
  title?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ExerciseTitle {
  @Field(() => ID)
  gymId: string;

  @Field()
  gymName: string;

  @Field(() => ID)
  exerciseId: string;

  @Field()
  exerciseName: string;

  @Field()
  title: string;
}
