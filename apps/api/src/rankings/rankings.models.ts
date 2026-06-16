import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum RankingCategory {
  BENCH = 'bench',
  DEADLIFT = 'deadlift',
  SQUAT = 'squat',
  OVERALL = 'overall',
  CONSISTENCY = 'consistency',
  EVOLUTION = 'evolution',
  REELS = 'reels',
}

registerEnumType(RankingCategory, { name: 'RankingCategory' });

@ObjectType()
export class CityRankingEntryModel {
  @Field(() => Int)
  rank: number;

  @Field(() => ID)
  userId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => Float)
  value: number;

  @Field({ nullable: true })
  unit?: string;
}

@ObjectType()
export class CityRankingsResultModel {
  @Field()
  category: string;

  @Field({ nullable: true })
  city?: string;

  @Field(() => [CityRankingEntryModel])
  entries: CityRankingEntryModel[];

  @Field(() => Int, { nullable: true })
  myRank?: number;

  @Field(() => Float, { nullable: true })
  myValue?: number;
}

@ObjectType()
export class MyRankingPositionModel {
  @Field()
  category: string;

  @Field(() => Int, { nullable: true })
  rank?: number;

  @Field(() => Float, { nullable: true })
  value?: number;

  @Field()
  isTopOne: boolean;
}
