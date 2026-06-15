import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Submission {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  weight: number;

  @Field(() => Int)
  reps: number;

  @Field()
  videoUrl: string;

  @Field()
  createdAt: Date;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  gymId: string;

  @Field(() => ID)
  exerciseId: string;
}
