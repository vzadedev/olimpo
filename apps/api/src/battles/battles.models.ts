import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BattleUserModel {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  instagramUsername?: string;
}

@ObjectType()
export class BattleModel {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  modality: string;

  @Field()
  status: string;

  @Field(() => Float)
  challengerBestKg: number;

  @Field(() => Float)
  challengedBestKg: number;

  @Field(() => Float)
  challengerBestVolume: number;

  @Field(() => Float)
  challengedBestVolume: number;

  @Field(() => Int)
  challengerAttemptCount: number;

  @Field(() => Int)
  challengedAttemptCount: number;

  @Field()
  windowStart: Date;

  @Field()
  windowEnd: Date;

  @Field()
  deadline: Date;

  @Field({ nullable: true })
  acceptedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  provocationMessage?: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  winningSide?: string;

  @Field(() => BattleUserModel)
  challenger: BattleUserModel;

  @Field(() => BattleUserModel)
  challenged: BattleUserModel;

  @Field(() => BattleUserModel, { nullable: true })
  winner?: BattleUserModel;

  @Field()
  exerciseName: string;

  @Field(() => ID)
  exerciseId: string;
}

@ObjectType()
export class UserBattleStatsModel {
  @Field(() => Int)
  totalBattles: number;

  @Field(() => Int)
  wins: number;

  @Field(() => Int)
  losses: number;

  @Field(() => Int)
  draws: number;

  @Field(() => Int)
  winStreak: number;

  @Field(() => Int)
  bestWinStreak: number;

  @Field(() => Int)
  winRate: number;

  @Field({ nullable: true })
  favoriteExerciseName?: string;
}

@ObjectType()
export class PendingBattlesSummaryModel {
  @Field(() => BattleModel, { nullable: true })
  latest?: BattleModel;

  @Field(() => Int)
  total: number;
}
