import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { ExerciseTitle } from '../train/train.models';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  role?: string;

  @Field({ nullable: true })
  wallpaperUrl?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  appIconUrl?: string;

  @Field({ nullable: true })
  theme?: string;

  @Field({ nullable: true })
  instagramUsername?: string;

  @Field({ nullable: true })
  city?: string;

  @Field(() => Float, { nullable: true })
  heightCm?: number;

  @Field(() => Float, { nullable: true })
  weightKg?: number;

  @Field({ nullable: true })
  birthDate?: Date;

  @Field({ nullable: true })
  sex?: string;

  @Field({ nullable: true })
  bmi?: number;

  @Field({ nullable: true })
  globalRank?: string;

  @Field(() => Int, { nullable: true })
  globalScore?: number;

  @Field(() => [ExerciseTitle], { nullable: true })
  exerciseTitles?: ExerciseTitle[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
