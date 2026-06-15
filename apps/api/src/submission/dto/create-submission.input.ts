import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { Min } from 'class-validator';

@InputType()
export class CreateSubmissionInput {
  @Field(() => Float)
  weight: number;

  @Field(() => Int)
  @Min(1)
  reps: number;

  @Field()
  videoUrl: string;

  @Field(() => ID)
  gymId: string;

  @Field(() => ID)
  exerciseId: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;
}
