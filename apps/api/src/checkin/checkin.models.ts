import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PrivacySettingsModel {
  @Field()
  publicCheckin: boolean;

  @Field()
  publicProfile: boolean;

  @Field()
  showInRankings: boolean;

  @Field()
  autoBattlePosts: boolean;
}

@ObjectType()
export class CheckinModel {
  @Field(() => ID)
  id: string;

  @Field()
  gymName: string;

  @Field()
  checkedInAt: Date;

  @Field()
  expiresAt: Date;

  @Field()
  isPublic: boolean;

  @Field()
  userName: string;

  @Field({ nullable: true })
  userAvatarUrl?: string;

  @Field(() => Number)
  reactionCount: number;
}
