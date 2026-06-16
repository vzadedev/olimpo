import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

@InputType()
export class UpdateDietGoalInput {
  @Field(() => Int)
  @IsInt()
  @Min(500)
  caloriesGoal: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  proteinGoalG: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  carbGoalG: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  fatGoalG: number;

  @Field()
  @IsIn(['lose_weight', 'maintain', 'gain_muscle'])
  objective: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  aiExplanation?: string;
}

@InputType()
export class MealFoodInput {
  @Field()
  @IsString()
  @MaxLength(120)
  foodName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  quantityDescription?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  quantityG?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preparationMethod?: string;

  @Field(() => Float)
  @IsNumber()
  calories: number;

  @Field(() => Float)
  @IsNumber()
  proteinG: number;

  @Field(() => Float)
  @IsNumber()
  carbG: number;

  @Field(() => Float)
  @IsNumber()
  fatG: number;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  fiberG?: number;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  wasEditedByUser?: boolean;
}

@InputType()
export class CreateMealInput {
  @Field()
  @IsString()
  @MaxLength(120)
  name: string;

  @Field()
  @IsIn(['breakfast', 'lunch', 'dinner', 'snack', 'other'])
  mealType: string;

  @Field()
  @Type(() => Date)
  @IsDate()
  eatenAt: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  aiConfidence?: string;

  @Field(() => [MealFoodInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealFoodInput)
  foods: MealFoodInput[];
}

@InputType()
export class AnalyzeMealInput {
  @Field()
  @IsString()
  imageBase64: string;

  @Field({ defaultValue: 'image/jpeg' })
  @IsString()
  mediaType: string;
}

@InputType()
export class DietPlanMealInput {
  @Field(() => Int)
  @IsInt()
  @Min(0)
  dayOfWeek: number;

  @Field()
  @IsIn(['breakfast', 'lunch', 'dinner', 'snack', 'other'])
  mealType: string;

  @Field()
  @IsString()
  @MaxLength(120)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  calories?: number;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  proteinG?: number;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  carbG?: number;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  fatG?: number;
}

@InputType()
export class CreateDietPlanInput {
  @Field()
  @IsString()
  @MaxLength(120)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [DietPlanMealInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanMealInput)
  meals: DietPlanMealInput[];
}
