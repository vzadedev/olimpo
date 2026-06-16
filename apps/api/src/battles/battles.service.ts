import {

  BadRequestException,

  ForbiddenException,

  Injectable,

  NotFoundException,

  OnModuleDestroy,

  OnModuleInit,

} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import { PostsService } from '../posts/posts.service';

import { CreateBattleInput } from './dto/battles.input';



const userSelect = {

  id: true,

  name: true,

  avatarUrl: true,

  instagramUsername: true,

} as const;



const WINDOW_DURATIONS: Record<string, number> = {

  '30': 30 * 60 * 1000,

  '60': 60 * 60 * 1000,

  '120': 2 * 60 * 60 * 1000,

  '1440': 24 * 60 * 60 * 1000,

};



type BattleRow = {

  id: string;

  type: string;

  modality: string;

  status: string;

  challengerBestKg: number;

  challengedBestKg: number;

  challengerBestVolume: number;

  challengedBestVolume: number;

  windowStart: Date;

  windowEnd: Date;

  acceptedAt: Date | null;

  completedAt: Date | null;

  resolvedAt: Date | null;

  provocationMessage: string | null;

  createdAt: Date;

  exerciseId: string;

  challengerId: string;

  challengedId: string;

  challenger: { id: string; name: string | null; avatarUrl: string | null; instagramUsername: string | null };

  challenged: { id: string; name: string | null; avatarUrl: string | null; instagramUsername: string | null };

  winner: { id: string; name: string | null; avatarUrl: string | null; instagramUsername: string | null } | null;

  exercise: { name: string };

  attempts?: { userId: string }[];

};



@Injectable()

export class BattlesService implements OnModuleInit, OnModuleDestroy {

  private cronTimer?: ReturnType<typeof setInterval>;



  constructor(

    private prisma: PrismaService,

    private notifications: NotificationsService,

    private posts: PostsService,

  ) {}



  onModuleInit() {

    void this.resolveExpiredBattles();

    this.cronTimer = setInterval(() => {

      void this.resolveExpiredBattles();

    }, 60_000);

  }



  onModuleDestroy() {

    if (this.cronTimer) clearInterval(this.cronTimer);

  }



  private mapBattle(b: BattleRow, userId?: string) {

    const challengerAttempts = b.attempts?.filter((a) => a.userId === b.challengerId).length ?? 0;

    const challengedAttempts = b.attempts?.filter((a) => a.userId === b.challengedId).length ?? 0;



    let winningSide: string | undefined;

    if (b.status === 'active' && userId) {

      const isChallenger = b.challengerId === userId;

      const myBest =

        b.modality === 'max_volume'

          ? isChallenger

            ? b.challengerBestVolume

            : b.challengedBestVolume

          : isChallenger

            ? b.challengerBestKg

            : b.challengedBestKg;

      const theirBest =

        b.modality === 'max_volume'

          ? isChallenger

            ? b.challengedBestVolume

            : b.challengerBestVolume

          : isChallenger

            ? b.challengedBestKg

            : b.challengerBestKg;

      if (myBest > theirBest) winningSide = 'me';

      else if (myBest < theirBest) winningSide = 'them';

      else winningSide = 'tie';

    }



    return {

      id: b.id,

      type: b.type,

      modality: b.modality,

      status: b.status,

      challengerBestKg: b.challengerBestKg,

      challengedBestKg: b.challengedBestKg,

      challengerBestVolume: b.challengerBestVolume,

      challengedBestVolume: b.challengedBestVolume,

      challengerAttemptCount: challengerAttempts,

      challengedAttemptCount: challengedAttempts,

      windowStart: b.windowStart,

      windowEnd: b.windowEnd,

      deadline: b.windowEnd,

      acceptedAt: b.acceptedAt ?? undefined,

      completedAt: b.completedAt ?? undefined,

      provocationMessage: b.provocationMessage ?? undefined,

      createdAt: b.createdAt,

      exerciseId: b.exerciseId,

      exerciseName: b.exercise.name,

      winningSide,

      challenger: {

        id: b.challenger.id,

        name: b.challenger.name ?? undefined,

        avatarUrl: b.challenger.avatarUrl ?? undefined,

        instagramUsername: b.challenger.instagramUsername ?? undefined,

      },

      challenged: {

        id: b.challenged.id,

        name: b.challenged.name ?? undefined,

        avatarUrl: b.challenged.avatarUrl ?? undefined,

        instagramUsername: b.challenged.instagramUsername ?? undefined,

      },

      winner: b.winner

        ? {

            id: b.winner.id,

            name: b.winner.name ?? undefined,

            avatarUrl: b.winner.avatarUrl ?? undefined,

            instagramUsername: b.winner.instagramUsername ?? undefined,

          }

        : undefined,

    };

  }



  private includeBattle() {

    return {

      challenger: { select: userSelect },

      challenged: { select: userSelect },

      winner: { select: userSelect },

      exercise: { select: { name: true } },

      attempts: { select: { userId: true } },

    };

  }



  async listBattles(userId: string) {

    const battles = await this.prisma.battle.findMany({

      where: { OR: [{ challengerId: userId }, { challengedId: userId }] },

      include: this.includeBattle(),

      orderBy: { createdAt: 'desc' },

    });

    return battles.map((b) => this.mapBattle(b, userId));

  }



  async battleHistory(userId: string, targetUserId?: string) {

    const uid = targetUserId ?? userId;

    const battles = await this.prisma.battle.findMany({

      where: {

        OR: [{ challengerId: uid }, { challengedId: uid }],

        status: { in: ['completed', 'expired'] },

      },

      include: this.includeBattle(),

      orderBy: { completedAt: 'desc' },

      take: 50,

    });

    return battles.map((b) => this.mapBattle(b, userId));

  }



  async pendingBattles(userId: string) {

    const now = new Date();

    const battles = await this.prisma.battle.findMany({

      where: {

        challengedId: userId,

        status: 'pending',

        acceptedAt: null,

        windowStart: { gt: now },

      },

      include: this.includeBattle(),

      orderBy: { createdAt: 'desc' },

    });

    return battles.map((b) => this.mapBattle(b, userId));

  }



  async pendingBattlesSummary(userId: string) {

    const pending = await this.pendingBattles(userId);

    return {

      latest: pending[0],

      total: pending.length,

    };

  }



  async activeBattles(userId: string) {

    const now = new Date();

    const battles = await this.prisma.battle.findMany({

      where: {

        status: 'active',

        windowStart: { lte: now },

        windowEnd: { gt: now },

        OR: [{ challengerId: userId }, { challengedId: userId }],

      },

      include: this.includeBattle(),

      orderBy: { windowEnd: 'asc' },

    });

    return battles.map((b) => this.mapBattle(b, userId));

  }



  async unseenBattleResults(userId: string) {

    const notifications = await this.prisma.notification.findMany({

      where: { userId, type: 'battle_result', read: false },

      orderBy: { createdAt: 'desc' },

      take: 10,

    });

    if (notifications.length === 0) return [];



    const battleIds = notifications.map((n) => n.referenceId).filter(Boolean) as string[];

    const battles = await this.prisma.battle.findMany({

      where: { id: { in: battleIds } },

      include: this.includeBattle(),

    });

    return battles.map((b) => this.mapBattle(b, userId));

  }



  async markBattleResultsSeen(userId: string) {

    await this.prisma.notification.updateMany({

      where: { userId, type: 'battle_result', read: false },

      data: { read: true },

    });

    return true;

  }



  async getBattleStats(userId: string) {

    let stats = await this.prisma.userBattleStats.findUnique({

      where: { userId },

      include: { favoriteExercise: { select: { name: true } } },

    });



    if (!stats) {

      stats = await this.prisma.userBattleStats.create({

        data: { userId },

        include: { favoriteExercise: { select: { name: true } } },

      });

    }



    const winRate =

      stats.totalBattles > 0

        ? Math.round((stats.wins / stats.totalBattles) * 100)

        : 0;



    return {

      totalBattles: stats.totalBattles,

      wins: stats.wins,

      losses: stats.losses,

      draws: stats.draws,

      winStreak: stats.winStreak,

      bestWinStreak: stats.bestWinStreak,

      winRate,

      favoriteExerciseName: stats.favoriteExercise?.name ?? undefined,

    };

  }



  async getBattle(userId: string, battleId: string) {

    const battle = await this.prisma.battle.findFirst({

      where: {

        id: battleId,

        OR: [{ challengerId: userId }, { challengedId: userId }],

      },

      include: this.includeBattle(),

    });

    if (!battle) throw new NotFoundException('Duelo não encontrado');

    return this.mapBattle(battle, userId);

  }



  async createBattle(userId: string, input: CreateBattleInput) {

    if (userId === input.challengedId) {

      throw new BadRequestException('Você não pode desafiar a si mesmo');

    }



    const challenged = await this.prisma.user.findUnique({

      where: { id: input.challengedId },

    });

    if (!challenged) throw new NotFoundException('Usuário não encontrado');



    const exercise = await this.prisma.exercise.findUnique({

      where: { id: input.exerciseId },

    });

    if (!exercise) throw new NotFoundException('Exercício não encontrado');



    const windowStart = new Date(input.windowStart);

    if (Number.isNaN(windowStart.getTime())) {

      throw new BadRequestException('Data de início inválida');

    }

    if (windowStart.getTime() <= Date.now()) {

      throw new BadRequestException('A janela deve começar no futuro');

    }



    const durationMs = WINDOW_DURATIONS[String(input.windowDurationMinutes)];

    if (!durationMs) {

      throw new BadRequestException('Duração da janela inválida');

    }

    const windowEnd = new Date(windowStart.getTime() + durationMs);



    const battle = await this.prisma.battle.create({

      data: {

        challengerId: userId,

        challengedId: input.challengedId,

        exerciseId: input.exerciseId,

        modality: input.modality ?? 'max_weight',

        provocationMessage: input.provocationMessage,

        windowStart,

        windowEnd,

      },

      include: this.includeBattle(),

    });



    await this.notifications.create({

      userId: input.challengedId,

      type: 'battle_invite',

      referenceId: battle.id,

      referenceType: 'battle',

    });



    return this.mapBattle(battle, userId);

  }



  async acceptBattle(userId: string, battleId: string) {

    const battle = await this.prisma.battle.findUnique({ where: { id: battleId } });

    if (!battle) throw new NotFoundException('Duelo não encontrado');

    if (battle.challengedId !== userId) throw new ForbiddenException('Sem permissão');

    if (battle.status !== 'pending') throw new BadRequestException('Duelo não está pendente');

    if (battle.acceptedAt) throw new BadRequestException('Duelo já foi aceito');

    if (battle.windowStart.getTime() <= Date.now()) {

      throw new BadRequestException('Prazo para aceitar expirou');

    }



    const now = new Date();

    const becomesActive = now >= battle.windowStart && now < battle.windowEnd;



    const updated = await this.prisma.battle.update({

      where: { id: battleId },

      data: {

        acceptedAt: now,

        status: becomesActive ? 'active' : 'pending',

      },

      include: this.includeBattle(),

    });



    await this.notifications.create({

      userId: battle.challengerId,

      type: 'battle_accepted',

      referenceId: battleId,

      referenceType: 'battle',

    });



    return this.mapBattle(updated, userId);

  }



  async declineBattle(userId: string, battleId: string) {

    const battle = await this.prisma.battle.findUnique({ where: { id: battleId } });

    if (!battle) throw new NotFoundException('Duelo não encontrado');

    if (battle.challengedId !== userId) throw new ForbiddenException('Sem permissão');



    const updated = await this.prisma.battle.update({

      where: { id: battleId },

      data: { status: 'declined', completedAt: new Date(), resolvedAt: new Date() },

      include: this.includeBattle(),

    });

    return this.mapBattle(updated, userId);

  }



  async recordSubmissionForBattles(

    userId: string,

    exerciseId: string,

    weight: number,

    reps: number,

    submissionId: string,

  ) {

    const now = new Date();

    const volume = weight * reps;



    const battles = await this.prisma.battle.findMany({

      where: {

        status: 'active',

        exerciseId,

        windowStart: { lte: now },

        windowEnd: { gt: now },

        OR: [{ challengerId: userId }, { challengedId: userId }],

      },

    });



    for (const battle of battles) {

      await this.prisma.battleAttempt.create({

        data: {

          battleId: battle.id,

          userId,

          weightKg: weight,

          reps,

          volume,

          submissionId,

        },

      });



      const isChallenger = battle.challengerId === userId;

      const data: Record<string, number> = {};



      if (battle.modality === 'max_volume') {

        const field = isChallenger ? 'challengerBestVolume' : 'challengedBestVolume';

        const current = isChallenger ? battle.challengerBestVolume : battle.challengedBestVolume;

        if (volume > current) data[field] = volume;

        const kgField = isChallenger ? 'challengerBestKg' : 'challengedBestKg';

        const currentKg = isChallenger ? battle.challengerBestKg : battle.challengedBestKg;

        if (weight > currentKg) data[kgField] = weight;

      } else {

        const field = isChallenger ? 'challengerBestKg' : 'challengedBestKg';

        const current = isChallenger ? battle.challengerBestKg : battle.challengedBestKg;

        if (weight > current) {

          data[field] = weight;

          const volField = isChallenger ? 'challengerBestVolume' : 'challengedBestVolume';

          const currentVol = isChallenger ? battle.challengerBestVolume : battle.challengedBestVolume;

          if (volume > currentVol) data[volField] = volume;

        }

      }



      if (Object.keys(data).length > 0) {

        await this.prisma.battle.update({ where: { id: battle.id }, data });

      }

    }

  }



  async updateBattleScores(userId: string, exerciseId: string, weight: number) {

    await this.recordSubmissionForBattles(userId, exerciseId, weight, 1, '');

  }



  async resolveExpiredBattles() {

    const now = new Date();



    await this.prisma.battle.updateMany({

      where: {

        status: 'pending',

        acceptedAt: null,

        windowStart: { lte: now },

        resolvedAt: null,

      },

      data: { status: 'expired', completedAt: now, resolvedAt: now },

    });



    const toActivate = await this.prisma.battle.findMany({

      where: {

        status: 'pending',

        acceptedAt: { not: null },

        windowStart: { lte: now },

        windowEnd: { gt: now },

        resolvedAt: null,

      },

    });



    for (const battle of toActivate) {

      const activated = await this.prisma.battle.updateMany({

        where: { id: battle.id, status: 'pending' },

        data: { status: 'active' },

      });

      if (activated.count === 0) continue;



      await this.notifications.createMany([

        {

          userId: battle.challengerId,

          type: 'battle_started',

          referenceId: battle.id,

          referenceType: 'battle',

        },

        {

          userId: battle.challengedId,

          type: 'battle_started',

          referenceId: battle.id,

          referenceType: 'battle',

        },

      ]);

    }



    const toResolve = await this.prisma.battle.findMany({

      where: {

        status: 'active',

        windowEnd: { lte: now },

        resolvedAt: null,

      },

      include: this.includeBattle(),

    });



    for (const battle of toResolve) {

      await this.finishBattle(battle);

    }

  }



  private async finishBattle(battle: BattleRow) {

    const lock = await this.prisma.battle.updateMany({

      where: { id: battle.id, status: 'active', resolvedAt: null },

      data: { resolvedAt: new Date() },

    });

    if (lock.count === 0) return;



    let winnerId: string | null = null;

    let status = 'completed';



    const useVolume = battle.modality === 'max_volume';

    const challengerScore = useVolume ? battle.challengerBestVolume : battle.challengerBestKg;

    const challengedScore = useVolume ? battle.challengedBestVolume : battle.challengedBestKg;



    if (challengerScore > challengedScore) {

      winnerId = battle.challengerId;

    } else if (challengedScore > challengerScore) {

      winnerId = battle.challengedId;

    } else if (challengerScore === 0 && challengedScore === 0) {

      status = 'expired';

    }



    await this.prisma.battle.update({

      where: { id: battle.id },

      data: { status, winnerId, completedAt: new Date() },

    });



    await this.updateUserBattleStats(battle, winnerId);



    await this.notifications.createMany([

      {

        userId: battle.challengerId,

        type: 'battle_result',

        referenceId: battle.id,

        referenceType: 'battle',

      },

      {

        userId: battle.challengedId,

        type: 'battle_result',

        referenceId: battle.id,

        referenceType: 'battle',

      },

    ]);



    if (winnerId) {

      await this.prisma.userBadge.upsert({

        where: { userId_badgeType: { userId: winnerId, badgeType: 'battle_winner' } },

        create: { userId: winnerId, badgeType: 'battle_winner' },

        update: {},

      });



      const privacy = await this.prisma.userPrivacySettings.findUnique({

        where: { userId: winnerId },

      });

      if (privacy?.autoBattlePosts !== false) {

        const winner = await this.prisma.user.findUnique({ where: { id: winnerId } });

        const loserId =

          winnerId === battle.challengerId ? battle.challengedId : battle.challengerId;

        const loser = await this.prisma.user.findUnique({ where: { id: loserId } });

        const best = useVolume

          ? winnerId === battle.challengerId

            ? battle.challengerBestVolume

            : battle.challengedBestVolume

          : winnerId === battle.challengerId

            ? battle.challengerBestKg

            : battle.challengedBestKg;

        const unit = useVolume ? ' pts vol.' : 'kg';

        const winnerTag = winner?.instagramUsername ?? winner?.name ?? 'vencedor';

        const loserTag = loser?.instagramUsername ?? loser?.name ?? 'oponente';

        await this.posts.createPost(winnerId, {

          content: `@${winnerTag} venceu o duelo de ${battle.exercise.name} contra @${loserTag} com ${best}${unit}! ⚔️`,

          mentionUserIds: loserId ? [loserId] : [],

        });

      }

    }

  }



  private async updateUserBattleStats(battle: BattleRow, winnerId: string | null) {

    const participants = [

      { userId: battle.challengerId, won: winnerId === battle.challengerId },

      { userId: battle.challengedId, won: winnerId === battle.challengedId },

    ];



    for (const { userId, won } of participants) {

      const isDraw = !winnerId;

      const existing = await this.prisma.userBattleStats.findUnique({ where: { userId } });

      const prevStreak = existing?.winStreak ?? 0;

      const newStreak = isDraw ? 0 : won ? prevStreak + 1 : 0;



      await this.prisma.userBattleStats.upsert({

        where: { userId },

        create: {

          userId,

          totalBattles: 1,

          wins: won ? 1 : 0,

          losses: !isDraw && !won ? 1 : 0,

          draws: isDraw ? 1 : 0,

          winStreak: newStreak,

          bestWinStreak: newStreak,

          favoriteExerciseId: battle.exerciseId,

        },

        update: {

          totalBattles: { increment: 1 },

          wins: won ? { increment: 1 } : undefined,

          losses: !isDraw && !won ? { increment: 1 } : undefined,

          draws: isDraw ? { increment: 1 } : undefined,

          winStreak: newStreak,

          bestWinStreak: Math.max(existing?.bestWinStreak ?? 0, newStreak),

        },

      });

    }



    for (const uid of [battle.challengerId, battle.challengedId]) {

      const top = await this.prisma.battle.groupBy({

        by: ['exerciseId'],

        where: {

          OR: [{ challengerId: uid }, { challengedId: uid }],

          status: { in: ['completed', 'expired'] },

        },

        _count: { exerciseId: true },

        orderBy: { _count: { exerciseId: 'desc' } },

        take: 1,

      });

      if (top[0]) {

        await this.prisma.userBattleStats.updateMany({

          where: { userId: uid },

          data: { favoriteExerciseId: top[0].exerciseId },

        });

      }

    }

  }

}


