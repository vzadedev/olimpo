import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

@InputType()
export class CreateSubmissionInput {
  @Field(() => Float)
  @IsNumber()
  @Type(() => Number)
  weight: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Type(() => Number)
  reps: number;

  @Field()
  @IsString()
  videoUrl: string;

  @Field(() => ID)
  @IsString()
  gymId: string;

  @Field(() => ID)
  @IsString()
  exerciseId: string;

  @Field(() => Float)
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @Field(() => Float)
  @IsNumber()
  @Type(() => Number)
  longitude: number;
}
