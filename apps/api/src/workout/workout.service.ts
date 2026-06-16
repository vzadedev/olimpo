import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkoutPlanInput,
  ScheduleWorkoutInput,
  WorkoutPlanExerciseInput,
} from '../goals/dto/goal.inputs';
import { GoalsService } from '../goals/goals.service';

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable()
export class WorkoutService {
  constructor(
    private prisma: PrismaService,
    private goalsService: GoalsService,
  ) {}

  async listExercises(search?: string) {
    return this.prisma.exercise.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async listPlans(userId: string) {
    const plans = await this.prisma.workoutPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' },
          include: { exercise: true },
        },
      },
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? undefined,
      createdAt: p.createdAt,
      exercises: p.exercises.map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        exerciseName: e.exercise.name,
        muscleGroup: e.exercise.muscleGroup ?? undefined,
        sets: e.sets,
        reps: e.reps,
        suggestedWeight: e.suggestedWeight ?? undefined,
        restSeconds: e.restSeconds,
        orderIndex: e.orderIndex,
      })),
    }));
  }

  async updatePlan(
    userId: string,
    planId: string,
    input: { name?: string; description?: string },
  ) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) throw new NotFoundException('Planilha não encontrada');

    await this.prisma.workoutPlan.update({
      where: { id: planId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
    return this.getPlan(userId, planId);
  }

  async addPlanExercise(
    userId: string,
    planId: string,
    exercise: WorkoutPlanExerciseInput,
  ) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
      include: { exercises: true },
    });
    if (!plan) throw new NotFoundException('Planilha não encontrada');

    const exists = plan.exercises.some((e) => e.exerciseId === exercise.exerciseId);
    if (exists) throw new BadRequestException('Exercício já está na planilha');

    const maxOrder = plan.exercises.reduce(
      (max, e) => Math.max(max, e.orderIndex),
      -1,
    );

    await this.prisma.workoutPlanExercise.create({
      data: {
        planId,
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        reps: exercise.reps,
        suggestedWeight: exercise.suggestedWeight,
        restSeconds: exercise.restSeconds,
        orderIndex: exercise.orderIndex ?? maxOrder + 1,
      },
    });

    return this.getPlan(userId, planId);
  }

  async reorderPlanExercises(userId: string, planId: string, orderedIds: string[]) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
      include: { exercises: true },
    });
    if (!plan) throw new NotFoundException('Planilha não encontrada');

    const idSet = new Set(plan.exercises.map((e) => e.id));
    if (orderedIds.length !== plan.exercises.length) {
      throw new BadRequestException('Lista de reordenação incompleta');
    }
    for (const id of orderedIds) {
      if (!idSet.has(id)) throw new BadRequestException('Exercício inválido na reordenação');
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.workoutPlanExercise.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.getPlan(userId, planId);
  }

  async createPlan(userId: string, input: CreateWorkoutPlanInput) {
    const plan = await this.prisma.workoutPlan.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
      },
    });
    return this.getPlan(userId, plan.id);
  }

  async getPlan(userId: string, planId: string) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' },
          include: { exercise: true },
        },
      },
    });
    if (!plan) throw new NotFoundException('Planilha não encontrada');
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description ?? undefined,
      createdAt: plan.createdAt,
      exercises: plan.exercises.map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        exerciseName: e.exercise.name,
        muscleGroup: e.exercise.muscleGroup ?? undefined,
        sets: e.sets,
        reps: e.reps,
        suggestedWeight: e.suggestedWeight ?? undefined,
        restSeconds: e.restSeconds,
        orderIndex: e.orderIndex,
      })),
    };
  }

  async updatePlanExercises(
    userId: string,
    planId: string,
    exercises: WorkoutPlanExerciseInput[],
  ) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) throw new NotFoundException('Planilha não encontrada');

    await this.prisma.workoutPlanExercise.deleteMany({ where: { planId } });
    await this.prisma.workoutPlanExercise.createMany({
      data: exercises.map((e, index) => ({
        planId,
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        suggestedWeight: e.suggestedWeight,
        restSeconds: e.restSeconds,
        orderIndex: e.orderIndex ?? index,
      })),
    });

    return this.getPlan(userId, planId);
  }

  async deletePlan(userId: string, planId: string) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) throw new NotFoundException('Planilha não encontrada');
    await this.prisma.workoutPlan.delete({ where: { id: planId } });
    return true;
  }

  async scheduleWorkout(userId: string, input: ScheduleWorkoutInput) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: input.planId, userId },
    });
    if (!plan) throw new NotFoundException('Planilha não encontrada');

    const date = new Date(input.scheduledDate);
    date.setHours(0, 0, 0, 0);

    const created = await this.prisma.workoutSchedule.create({
      data: {
        userId,
        planId: input.planId,
        scheduledDate: date,
      },
      include: { plan: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.mapSchedule(created, today);
  }

  async deleteSchedule(userId: string, scheduleId: string) {
    const schedule = await this.prisma.workoutSchedule.findFirst({
      where: { id: scheduleId, userId },
    });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');
    await this.prisma.workoutSchedule.delete({ where: { id: scheduleId } });
    return true;
  }

  async completeSchedule(userId: string, scheduleId: string) {
    const schedule = await this.prisma.workoutSchedule.findFirst({
      where: { id: scheduleId, userId },
    });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');

    const updated = await this.prisma.workoutSchedule.update({
      where: { id: scheduleId },
      data: { completed: true, completedAt: new Date() },
      include: { plan: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.mapSchedule(updated, today);
  }

  async getCalendar(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const schedules = await this.prisma.workoutSchedule.findMany({
      where: {
        userId,
        scheduledDate: { gte: start, lte: end },
      },
      include: { plan: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byDate = new Map<string, typeof schedules>();
    for (const s of schedules) {
      const key = dateKey(s.scheduledDate);
      const list = byDate.get(key) ?? [];
      list.push(s);
      byDate.set(key, list);
    }

    const days = [];
    const daysInMonth = end.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const key = dateKey(date);
      const daySchedules = byDate.get(key) ?? [];
      const completedCount = daySchedules.filter((s) => s.completed).length;
      const missedCount = daySchedules.filter(
        (s) => !s.completed && date < today,
      ).length;
      const scheduledCount = daySchedules.length;

      let status = 'empty';
      if (completedCount > 0 && completedCount === scheduledCount) status = 'completed';
      else if (missedCount > 0) status = 'missed';
      else if (scheduledCount > 0) status = 'scheduled';

      const indicators = daySchedules.map((s) => {
        const mapped = this.mapSchedule(s, today);
        return {
          planName: mapped.planName,
          status: mapped.status,
        };
      });

      days.push({
        date: key,
        scheduledCount,
        completedCount,
        missedCount,
        status,
        indicators,
      });
    }

    const streak = await this.computeTrainingStreak(userId);

    return { days, streak, schedules: schedules.map((s) => this.mapSchedule(s, today)) };
  }

  private mapSchedule(
    s: {
      id: string;
      planId: string;
      scheduledDate: Date;
      completed: boolean;
      completedAt: Date | null;
      plan: { name: string };
    },
    today: Date,
  ) {
    let status = 'scheduled';
    const date = new Date(s.scheduledDate);
    date.setHours(0, 0, 0, 0);
    if (s.completed) status = 'completed';
    else if (date < today) status = 'missed';

    return {
      id: s.id,
      planId: s.planId,
      planName: s.plan.name,
      scheduledDate: s.scheduledDate,
      completed: s.completed,
      completedAt: s.completedAt ?? undefined,
      status,
    };
  }

  async getSchedulesForDate(userId: string, dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const schedules = await this.prisma.workoutSchedule.findMany({
      where: { userId, scheduledDate: { gte: date, lte: end } },
      include: { plan: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return schedules.map((s) => this.mapSchedule(s, today));
  }

  async startSession(userId: string, planId: string, scheduleId?: string) {
    const plan = await this.getPlan(userId, planId);
    const session = await this.prisma.workoutSession.create({
      data: {
        userId,
        planId,
        scheduleId,
      },
    });

    const sets = [];
    for (const ex of plan.exercises) {
      for (let setNumber = 1; setNumber <= ex.sets; setNumber++) {
        const set = await this.prisma.workoutSessionSet.create({
          data: {
            sessionId: session.id,
            planExerciseId: ex.id,
            setNumber,
          },
        });
        sets.push({
          id: set.id,
          planExerciseId: ex.id,
          exerciseName: ex.exerciseName,
          setNumber,
          completed: false,
        });
      }
    }

    return {
      id: session.id,
      planId: plan.id,
      planName: plan.name,
      startedAt: session.startedAt,
      sets,
    };
  }

  async completeSet(
    userId: string,
    sessionId: string,
    planExerciseId: string,
    setNumber: number,
  ) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');

    const set = await this.prisma.workoutSessionSet.findUnique({
      where: {
        sessionId_planExerciseId_setNumber: {
          sessionId,
          planExerciseId,
          setNumber,
        },
      },
    });
    if (!set) throw new NotFoundException('Série não encontrada');

    await this.prisma.workoutSessionSet.update({
      where: { id: set.id },
      data: { completed: true, completedAt: new Date() },
    });

    const remaining = await this.prisma.workoutSessionSet.count({
      where: { sessionId, completed: false },
    });

    if (remaining === 0) {
      await this.prisma.workoutSession.update({
        where: { id: sessionId },
        data: { completedAt: new Date() },
      });
      if (session.scheduleId) {
        await this.prisma.workoutSchedule.update({
          where: { id: session.scheduleId },
          data: { completed: true, completedAt: new Date() },
        });
        await this.goalsService.evaluateBadges(userId);
      }
    }

    return this.getSession(userId, sessionId);
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        plan: true,
        sets: {
          include: {
            planExercise: { include: { exercise: true } },
          },
          orderBy: [{ planExercise: { orderIndex: 'asc' } }, { setNumber: 'asc' }],
        },
      },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');

    return {
      id: session.id,
      planId: session.planId,
      planName: session.plan.name,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? undefined,
      sets: session.sets.map((s) => ({
        id: s.id,
        planExerciseId: s.planExerciseId,
        exerciseName: s.planExercise.exercise.name,
        setNumber: s.setNumber,
        completed: s.completed,
        reps: s.planExercise.reps,
        suggestedWeight: s.planExercise.suggestedWeight ?? undefined,
        restSeconds: s.planExercise.restSeconds,
      })),
    };
  }

  private async computeTrainingStreak(userId: string) {
    const completed = await this.prisma.workoutSchedule.findMany({
      where: { userId, completed: true },
      orderBy: { scheduledDate: 'desc' },
    });
    if (completed.length === 0) return 0;

    const days = new Set(
      completed.map((s) => s.scheduledDate.toISOString().slice(0, 10)),
    );
    let streak = 0;
    const check = new Date();
    check.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = check.toISOString().slice(0, 10);
      if (days.has(key)) streak += 1;
      else if (i === 0) {
        check.setDate(check.getDate() - 1);
        continue;
      } else break;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }
}
