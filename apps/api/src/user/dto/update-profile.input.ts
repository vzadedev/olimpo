import { Field, Float, InputType } from '@nestjs/graphql';
import { IsIn, IsOptional, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(80)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  wallpaperUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  appIconUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['dark', 'light'])
  theme?: string;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @Matches(/^[a-zA-Z0-9._]{1,30}$/, {
    message: 'Instagram inválido (use apenas letras, números, . e _)',
  })
  instagramUsername?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(80)
  city?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(50)
  heightCm?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(20)
  weightKg?: number;

  @Field({ nullable: true })
  @IsOptional()
  birthDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  sex?: string;
}
