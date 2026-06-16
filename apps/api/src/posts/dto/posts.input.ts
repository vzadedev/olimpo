import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field()
  @IsString()
  @MaxLength(500)
  content: string;

  @Field({ nullable: true })
  @IsOptional()
  liftId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  mentionUserIds?: string[];
}

@InputType()
export class CreatePostCommentInput {
  @Field()
  @IsString()
  @MaxLength(500)
  content: string;

  @Field({ nullable: true })
  @IsOptional()
  parentId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  mentionUserIds?: string[];
}

@InputType()
export class ReportPostInput {
  @Field()
  @MaxLength(80)
  reason: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}
