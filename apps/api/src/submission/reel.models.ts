import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@ObjectType()
export class ReelCommentModel {
  @Field(() => ID)
  id: string;

  @Field()
  text: string;

  @Field()
  userName: string;

  @Field(() => ID)
  userId: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  createdAt: Date;

  @Field(() => [ReelCommentModel], { nullable: true })
  replies?: ReelCommentModel[];
}

@ObjectType()
export class ReelCommentsPage {
  @Field(() => [ReelCommentModel])
  items: ReelCommentModel[];

  @Field()
  hasMore: boolean;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class ReelReportModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  submissionId: string;

  @Field()
  reason: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field()
  reporterName: string;

  @Field()
  reelExerciseName: string;

  @Field()
  createdAt: Date;
}

@InputType()
export class CreateReelCommentInput {
  @Field(() => ID)
  @IsString()
  submissionId: string;

  @Field()
  @IsString()
  @MaxLength(500)
  text: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string;
}

@InputType()
export class ReportReelInput {
  @Field(() => ID)
  @IsString()
  submissionId: string;

  @Field()
  @IsString()
  @MaxLength(80)
  reason: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@ObjectType()
export class ReelViewResult {
  @Field()
  counted: boolean;

  @Field(() => Int)
  viewCount: number;
}

@ObjectType()
export class ReelLikeResult {
  @Field()
  liked: boolean;

  @Field(() => Int)
  likeCount: number;
}

@ObjectType()
export class DeleteReelResult {
  @Field()
  success: boolean;
}
