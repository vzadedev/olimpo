import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdatePrivacyInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  publicCheckin?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showInRankings?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  autoBattlePosts?: boolean;
}

@InputType()
export class CreateCheckinInput {
  @Field()
  gymId: string;

  @Field()
  latitude: number;

  @Field()
  longitude: number;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  isPublic?: boolean;
}
