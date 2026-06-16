import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateBattleInput {
  @Field()
  @IsString()
  challengedId: string;

  @Field()
  @IsString()
  exerciseId: string;

  @Field()
  @Type(() => Date)
  @IsDate()
  windowStart: Date;

  @Field(() => Int)
  @IsInt()
  @IsIn([30, 60, 120, 1440])
  windowDurationMinutes: number;

  @Field({ defaultValue: 'max_weight' })
  @IsOptional()
  @IsIn(['max_weight', 'max_volume'])
  modality?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(100)
  provocationMessage?: string;
}
