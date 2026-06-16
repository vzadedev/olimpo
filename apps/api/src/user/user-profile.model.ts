import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { ExerciseTitle } from '../train/train.models';

@ObjectType()
export class UserBadgeModel {
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
export class UserProfileModel {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  instagramUsername?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  globalRank?: string;

  @Field(() => Int, { nullable: true })
  globalScore?: number;

  @Field(() => Float, { nullable: true })
  bmi?: number;

  @Field(() => [ExerciseTitle], { nullable: true })
  exerciseTitles?: ExerciseTitle[];

  @Field(() => [UserBadgeModel])
  badges: UserBadgeModel[];

  @Field(() => Int)
  submissionsCount: number;
}
