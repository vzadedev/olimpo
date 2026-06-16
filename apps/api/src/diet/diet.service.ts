import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealInput, CreateDietPlanInput, UpdateDietGoalInput } from './dto/diet.input';
import {
  getDayBoundsInTimeZone,
  getLocalCalendarDate,
  OLIMPO_DEFAULT_TIMEZONE,
} from '../common/date.util';

const GOAL_PRESETS: Record<
  string,
  { calories: number; protein: number; carb: number; fat: number }
> = {
  lose_weight: { calories: 1800, protein: 140, carb: 150, fat: 55 },
  maintain: { calories: 2200, protein: 150, carb: 220, fat: 70 },
  gain_muscle: { calories: 2800, protein: 180, carb: 320, fat: 80 },
};

@Injectable()
export class DietService {
  private anthropic: Anthropic | null = null;

  constructor(private prisma: PrismaService) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  private mapMeal(meal: {
    id: string;
    name: string;
    mealType: string;
    eatenAt: Date;
    notes: string | null;
    foods: {
      id: string;
      foodName: string;
      quantityDescription: string | null;
      calories: number;
      proteinG: number;
      carbG: number;
      fatG: number;
      fiberG: number;
    }[];
  }) {
    return {
      id: meal.id,
      name: meal.name,
      mealType: meal.mealType,
      eatenAt: meal.eatenAt,
      notes: meal.notes ?? undefined,
      foods: meal.foods.map((f) => ({
        id: f.id,
        foodName: f.foodName,
        quantityDescription: f.quantityDescription ?? undefined,
        calories: f.calories,
        proteinG: f.proteinG,
        carbG: f.carbG,
        fatG: f.fatG,
        fiberG: f.fiberG,
      })),
    };
  }

  async getGoal(userId: string) {
    return this.prisma.userDietGoal.findUnique({ where: { userId } });
  }

  async upsertGoal(userId: string, input: UpdateDietGoalInput & { aiExplanation?: string }) {
    const { aiExplanation, ...rest } = input;
    return this.prisma.userDietGoal.upsert({
      where: { userId },
      create: { userId, ...rest, aiExplanation },
      update: { ...rest, aiExplanation },
    });
  }

  suggestGoal(objective: string) {
    const preset = GOAL_PRESETS[objective] ?? GOAL_PRESETS.maintain;
    return {
      caloriesGoal: preset.calories,
      proteinGoalG: preset.protein,
      carbGoalG: preset.carb,
      fatGoalG: preset.fat,
      objective,
    };
  }

  private bucketWeight(w: number) {
    return Math.round(w / 5) * 5;
  }

  private bucketHeight(h: number) {
    return Math.round(h / 5) * 5;
  }

  private bucketBmi(bmi: number) {
    return Math.round(bmi * 2) / 2;
  }

  private computeBmi(weightKg: number, heightCm: number) {
    const h = heightCm / 100;
    return Math.round((weightKg / (h * h)) * 10) / 10;
  }

  async suggestGoalWithAI(userId: string, objective: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { weightKg: true, heightCm: true, sex: true, birthDate: true },
    });
    if (!user?.weightKg || !user?.heightCm) {
      throw new BadRequestException(
        'Informe peso e altura no perfil antes de gerar metas com IA',
      );
    }

    const bmi = this.computeBmi(user.weightKg, user.heightCm);
    const weightBucket = this.bucketWeight(user.weightKg);
    const heightBucket = this.bucketHeight(user.heightCm);
    const bmiBucket = this.bucketBmi(bmi);
    const sex = user.sex ?? null;

    const cached = await this.prisma.dietRecommendationCache.findFirst({
      where: { weightBucket, heightBucket, bmiBucket, sex, objective },
    });

    if (cached) {
      return this.upsertGoal(userId, {
        caloriesGoal: cached.caloriesGoal,
        proteinGoalG: cached.proteinGoalG,
        carbGoalG: cached.carbGoalG,
        fatGoalG: cached.fatGoalG,
        objective,
        aiExplanation: cached.aiExplanation,
      });
    }

    if (!this.anthropic) {
      const fallback = this.suggestGoal(objective);
      return this.upsertGoal(userId, {
        ...fallback,
        aiExplanation:
          'Metas padrão aplicadas (IA indisponível). Ajuste manualmente se necessário.',
      });
    }

    const age = user.birthDate
      ? Math.floor(
          (Date.now() - user.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000),
        )
      : null;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Você é nutricionista esportivo. Dados: peso ${user.weightKg}kg, altura ${user.heightCm}cm, IMC ${bmi}, sexo ${sex ?? 'n/i'}, idade ${age ?? 'n/i'}, objetivo ${objective}.
Retorne APENAS JSON: {"caloriesGoal":n,"proteinGoalG":n,"carbGoalG":n,"fatGoalG":n,"explanation":"texto curto pt-BR"}`,
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new BadRequestException('Resposta inválida da IA');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      throw new BadRequestException('Não foi possível interpretar recomendação da IA');
    }

    const explanation = String(parsed.explanation ?? 'Recomendação personalizada pela IA.');
    const goalData = {
      caloriesGoal: Math.round(Number(parsed.caloriesGoal ?? 2200)),
      proteinGoalG: Number(parsed.proteinGoalG ?? 150),
      carbGoalG: Number(parsed.carbGoalG ?? 220),
      fatGoalG: Number(parsed.fatGoalG ?? 70),
      objective,
      aiExplanation: explanation,
    };

    await this.prisma.dietRecommendationCache.create({
      data: {
        weightBucket,
        heightBucket,
        bmiBucket,
        sex,
        objective,
        caloriesGoal: goalData.caloriesGoal,
        proteinGoalG: goalData.proteinGoalG,
        carbGoalG: goalData.carbGoalG,
        fatGoalG: goalData.fatGoalG,
        aiExplanation: explanation,
      },
    });

    return this.upsertGoal(userId, goalData);
  }

  async getDashboard(userId: string, dateStr?: string) {
    const calendarDate =
      dateStr ?? getLocalCalendarDate(new Date(), OLIMPO_DEFAULT_TIMEZONE);
    const { start, end } = getDayBoundsInTimeZone(calendarDate, OLIMPO_DEFAULT_TIMEZONE);

    const [goal, meals] = await Promise.all([
      this.getGoal(userId),
      this.prisma.meal.findMany({
        where: { userId, eatenAt: { gte: start, lte: end } },
        include: { foods: true },
        orderBy: { eatenAt: 'asc' },
      }),
    ]);

    let caloriesConsumed = 0;
    let proteinG = 0;
    let carbG = 0;
    let fatG = 0;
    for (const meal of meals) {
      for (const f of meal.foods) {
        caloriesConsumed += f.calories;
        proteinG += f.proteinG;
        carbG += f.carbG;
        fatG += f.fatG;
      }
    }

    return {
      goal: goal ?? undefined,
      caloriesConsumed,
      proteinG,
      carbG,
      fatG,
      meals: meals.map((m) => this.mapMeal(m)),
    };
  }

  async getWeeklySummary(userId: string) {
    const today = getLocalCalendarDate(new Date(), OLIMPO_DEFAULT_TIMEZONE);
    const endBounds = getDayBoundsInTimeZone(today, OLIMPO_DEFAULT_TIMEZONE);
    const startDate = new Date(endBounds.start);
    startDate.setDate(startDate.getDate() - 6);
    const startStr = getLocalCalendarDate(startDate, OLIMPO_DEFAULT_TIMEZONE);
    const startBounds = getDayBoundsInTimeZone(startStr, OLIMPO_DEFAULT_TIMEZONE);

    const meals = await this.prisma.meal.findMany({
      where: {
        userId,
        eatenAt: { gte: startBounds.start, lte: endBounds.end },
      },
      include: { foods: true },
    });

    const byDay = new Map<string, DietDaySummary>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(startBounds.start.getTime() + i * 86400000);
      const key = getLocalCalendarDate(d, OLIMPO_DEFAULT_TIMEZONE);
      byDay.set(key, {
        date: key,
        calories: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
      });
    }

    for (const meal of meals) {
      const key = getLocalCalendarDate(meal.eatenAt, OLIMPO_DEFAULT_TIMEZONE);
      const day = byDay.get(key);
      if (!day) continue;
      for (const f of meal.foods) {
        day.calories += f.calories;
        day.proteinG += f.proteinG;
        day.carbG += f.carbG;
        day.fatG += f.fatG;
      }
    }

    return Array.from(byDay.values());
  }

  async createMeal(userId: string, input: CreateMealInput) {
    const foods = input.foods ?? [];
    const meal = await this.prisma.meal.create({
      data: {
        userId,
        name: input.name,
        mealType: input.mealType,
        eatenAt: input.eatenAt,
        notes: input.notes,
        aiConfidence: input.aiConfidence,
        foods: {
          create: foods.map((f) => ({
            foodName: f.foodName,
            preparationMethod: f.preparationMethod,
            quantityG: f.quantityG,
            quantityDescription: f.quantityDescription,
            calories: f.calories,
            proteinG: f.proteinG,
            carbG: f.carbG,
            fatG: f.fatG,
            fiberG: f.fiberG ?? 0,
            wasEditedByUser: f.wasEditedByUser ?? false,
          })),
        },
      },
      include: { foods: true },
    });
    return this.mapMeal(meal);
  }

  async deleteMeal(userId: string, mealId: string) {
    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
    });
    if (!meal) throw new BadRequestException('Refeição não encontrada');
    await this.prisma.meal.delete({ where: { id: mealId } });
    return true;
  }

  private async checkRateLimit(userId: string) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.dietAnalysisLog.count({
      where: { userId, createdAt: { gte: since } },
    });
    if (count >= 20) {
      throw new HttpException('Limite de 20 análises por hora', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async analyzeImage(
    userId: string,
    imageBase64: string,
    mediaType: string,
    userNote?: string,
    mealType?: string,
  ) {
    if (!this.anthropic) {
      throw new BadRequestException(
        'ANTHROPIC_API_KEY não configurada no servidor',
      );
    }
    await this.checkRateLimit(userId);

    const noteBlock = userNote
      ? `Observação do usuário: "${userNote}". Use isso para refinar as estimativas.\n`
      : '';
    const mealBlock = mealType
      ? `Tipo de refeição informado: ${mealType}.\n`
      : '';

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Você é um nutricionista do OLIMPO especialista em análise visual de alimentos.
Analise esta foto e retorne APENAS JSON válido, sem markdown.
${noteBlock}${mealBlock}
Regras:
- Estime quantidades pelo tamanho visual dos alimentos e do prato
- Considere o método de preparo (frito tem mais gordura)
- Se não tiver certeza use "confianca": "baixa" e explique na observacao
- Se não houver comida: { "erro": "Não foi possível identificar alimentos na imagem" }

Formato:
{
  "descricao": "descrição geral do prato em uma frase",
  "alimentos": [
    {
      "nome": "Frango grelhado",
      "metodo_preparo": "grelhado",
      "quantidade_g": 150,
      "quantidade_estimada": "1 filé médio",
      "calorias": 165,
      "proteina_g": 31,
      "carboidrato_g": 0,
      "gordura_g": 3.6,
      "fibra_g": 0
    }
  ],
  "totais": {
    "calorias": 450,
    "proteina_g": 35,
    "carboidrato_g": 55,
    "gordura_g": 12,
    "fibra_g": 5
  },
  "confianca": "alta | media | baixa",
  "observacao": ""
}`,
            },
          ],
        },
      ],
    });

    await this.prisma.dietAnalysisLog.create({ data: { userId } });

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new BadRequestException('Resposta inválida da IA');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      throw new BadRequestException('Não foi possível interpretar a resposta da IA');
    }

    if (parsed.erro) {
      return { erro: String(parsed.erro) };
    }

    const totais = parsed.totais as Record<string, number> | undefined;
    return {
      descricao: parsed.descricao as string | undefined,
      alimentos: (parsed.alimentos as Record<string, unknown>[] | undefined)?.map((a) => ({
        nome: String(a.nome ?? ''),
        metodo_preparo: a.metodo_preparo as string | undefined,
        quantidade_g: Number(a.quantidade_g ?? 0) || undefined,
        quantidade_estimada: (a.quantidade_estimada ?? a.quantidade_descricao) as string | undefined,
        calorias: Number(a.calorias ?? 0),
        proteina_g: Number(a.proteina_g ?? 0),
        carboidrato_g: Number(a.carboidrato_g ?? 0),
        gordura_g: Number(a.gordura_g ?? 0),
        fibra_g: Number(a.fibra_g ?? 0),
        _baseQuantidadeG: Number(a.quantidade_g ?? 100) || 100,
      })),
      confianca: parsed.confianca as string | undefined,
      observacao: parsed.observacao as string | undefined,
      totalCalorias: totais?.calorias,
      totalProteina: totais?.proteina_g,
      totalCarboidrato: totais?.carboidrato_g,
      totalGordura: totais?.gordura_g,
      totalFibra: totais?.fibra_g,
    };
  }

  private mapPlan(plan: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    meals: {
      id: string;
      dayOfWeek: number;
      mealType: string;
      name: string;
      notes: string | null;
      calories: number;
      proteinG: number;
      carbG: number;
      fatG: number;
    }[];
  }) {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description ?? undefined,
      isActive: plan.isActive,
      meals: plan.meals.map((m) => ({
        id: m.id,
        dayOfWeek: m.dayOfWeek,
        mealType: m.mealType,
        name: m.name,
        notes: m.notes ?? undefined,
        calories: m.calories,
        proteinG: m.proteinG,
        carbG: m.carbG,
        fatG: m.fatG,
      })),
    };
  }

  listPlans(userId: string) {
    return this.prisma.dietPlan
      .findMany({
        where: { userId },
        include: { meals: { orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }] } },
        orderBy: { createdAt: 'desc' },
      })
      .then((plans) => plans.map((p) => this.mapPlan(p)));
  }

  activePlan(userId: string) {
    return this.prisma.dietPlan
      .findFirst({
        where: { userId, isActive: true },
        include: { meals: { orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }] } },
      })
      .then((p) => (p ? this.mapPlan(p) : null));
  }

  async createPlan(userId: string, input: CreateDietPlanInput) {
    const plan = await this.prisma.dietPlan.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        meals: {
          create: input.meals.map((m, i) => ({
            dayOfWeek: m.dayOfWeek,
            mealType: m.mealType,
            name: m.name,
            notes: m.notes,
            calories: m.calories ?? 0,
            proteinG: m.proteinG ?? 0,
            carbG: m.carbG ?? 0,
            fatG: m.fatG ?? 0,
            sortOrder: i,
          })),
        },
      },
      include: { meals: { orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }] } },
    });
    return this.mapPlan(plan);
  }

  async activatePlan(userId: string, planId: string) {
    const plan = await this.prisma.dietPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new BadRequestException('Plano não encontrado');
    await this.prisma.$transaction([
      this.prisma.dietPlan.updateMany({ where: { userId }, data: { isActive: false } }),
      this.prisma.dietPlan.update({ where: { id: planId }, data: { isActive: true } }),
    ]);
    return this.activePlan(userId);
  }

  async deletePlan(userId: string, planId: string) {
    const plan = await this.prisma.dietPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new BadRequestException('Plano não encontrado');
    await this.prisma.dietPlan.delete({ where: { id: planId } });
    return true;
  }
}

type DietDaySummary = {
  date: string;
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
};
