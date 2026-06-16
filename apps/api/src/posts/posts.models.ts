import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PostAuthorModel {
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
export class PostLiftModel {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  weight: number;

  @Field(() => Int)
  reps: number;

  @Field()
  exerciseName: string;
}

@ObjectType()
export class PostModel {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field(() => PostAuthorModel)
  author: PostAuthorModel;

  @Field(() => PostLiftModel, { nullable: true })
  lift?: PostLiftModel;

  @Field(() => [String])
  tags: string[];

  @Field(() => Int)
  likeCount: number;

  @Field(() => Int)
  commentCount: number;

  @Field()
  likedByMe: boolean;

  @Field()
  isOwner: boolean;
}

@ObjectType()
export class PostCommentModel {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field(() => PostAuthorModel)
  author: PostAuthorModel;

  @Field(() => [PostCommentModel], { nullable: true })
  replies?: PostCommentModel[];
}

@ObjectType()
export class UserSearchResultModel {
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
export class NotificationModel {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  referenceId: string;

  @Field()
  referenceType: string;

  @Field()
  read: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PostsFeedModel {
  @Field(() => [PostModel])
  posts: PostModel[];

  @Field()
  hasMore: boolean;

  @Field(() => Int)
  page: number;
}
