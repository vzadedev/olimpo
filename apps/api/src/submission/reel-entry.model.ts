import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReelEntry {
  @Field(() => ID)
  id: string;

  @Field()
  videoUrl: string;

  @Field(() => Float)
  weight: number;

  @Field()
  createdAt: Date;

  @Field()
  userEmail: string;

  @Field({ nullable: true })
  userName?: string;

  @Field(() => ID)
  userId: string;

  @Field({ nullable: true })
  instagramUsername?: string;

  @Field()
  exerciseName: string;

  @Field()
  gymName: string;

  @Field(() => Int)
  viewCount: number;

  @Field(() => Int)
  commentCount: number;

  @Field(() => Int)
  likeCount: number;

  @Field()
  likedByMe: boolean;

  @Field()
  isOwner: boolean;
}
