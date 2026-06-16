import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserDietGoalModel {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  caloriesGoal: number;

  @Field(() => Float)
  proteinGoalG: number;

  @Field(() => Float)
  carbGoalG: number;

  @Field(() => Float)
  fatGoalG: number;

  @Field()
  objective: string;

  @Field({ nullable: true })
  aiExplanation?: string;
}

@ObjectType()
export class MealFoodModel {
  @Field(() => ID)
  id: string;

  @Field()
  foodName: string;

  @Field({ nullable: true })
  quantityDescription?: string;

  @Field(() => Float)
  calories: number;

  @Field(() => Float)
  proteinG: number;

  @Field(() => Float)
  carbG: number;

  @Field(() => Float)
  fatG: number;

  @Field(() => Float)
  fiberG: number;
}

@ObjectType()
export class MealModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  mealType: string;

  @Field()
  eatenAt: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [MealFoodModel])
  foods: MealFoodModel[];
}

@ObjectType()
export class DietDaySummaryModel {
  @Field()
  date: string;

  @Field(() => Float)
  calories: number;

  @Field(() => Float)
  proteinG: number;

  @Field(() => Float)
  carbG: number;

  @Field(() => Float)
  fatG: number;
}

@ObjectType()
export class DietDashboardModel {
  @Field(() => UserDietGoalModel, { nullable: true })
  goal?: UserDietGoalModel;

  @Field(() => Float)
  caloriesConsumed: number;

  @Field(() => Float)
  proteinG: number;

  @Field(() => Float)
  carbG: number;

  @Field(() => Float)
  fatG: number;

  @Field(() => [MealModel])
  meals: MealModel[];
}

@ObjectType()
export class DietAnalysisFoodModel {
  @Field()
  nome: string;

  @Field({ nullable: true })
  quantidade_estimada?: string;

  @Field(() => Float)
  calorias: number;

  @Field(() => Float)
  proteina_g: number;

  @Field(() => Float)
  carboidrato_g: number;

  @Field(() => Float)
  gordura_g: number;

  @Field(() => Float, { nullable: true })
  fibra_g?: number;
}

@ObjectType()
export class DietAnalysisResultModel {
  @Field({ nullable: true })
  descricao?: string;

  @Field(() => [DietAnalysisFoodModel], { nullable: true })
  alimentos?: DietAnalysisFoodModel[];

  @Field({ nullable: true })
  confianca?: string;

  @Field({ nullable: true })
  observacao?: string;

  @Field({ nullable: true })
  erro?: string;

  @Field(() => Float, { nullable: true })
  totalCalorias?: number;

  @Field(() => Float, { nullable: true })
  totalProteina?: number;

  @Field(() => Float, { nullable: true })
  totalCarboidrato?: number;

  @Field(() => Float, { nullable: true })
  totalGordura?: number;

  @Field(() => Float, { nullable: true })
  totalFibra?: number;
}

@ObjectType()
export class DietPlanMealModel {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  dayOfWeek: number;

  @Field()
  mealType: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Int)
  calories: number;

  @Field(() => Float)
  proteinG: number;

  @Field(() => Float)
  carbG: number;

  @Field(() => Float)
  fatG: number;
}

@ObjectType()
export class DietPlanModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isActive: boolean;

  @Field(() => [DietPlanMealModel])
  meals: DietPlanMealModel[];
}
