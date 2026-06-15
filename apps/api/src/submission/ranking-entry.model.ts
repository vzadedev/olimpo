import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RankingEntry {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  weight: number;

  @Field(() => Int)
  reps: number;

  @Field(() => Int)
  score: number;

  @Field(() => Int)
  rank: number;

  @Field()
  videoUrl: string;

  @Field()
  createdAt: Date;

  @Field()
  userEmail: string;

  @Field({ nullable: true })
  userName?: string;

  @Field({ nullable: true })
  title?: string;
}
