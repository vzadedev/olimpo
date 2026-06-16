import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  BattleModel,
  PendingBattlesSummaryModel,
  UserBattleStatsModel,
} from './battles.models';
import { CreateBattleInput } from './dto/battles.input';
import { BattlesService } from './battles.service';

@Resolver()
export class BattlesResolver {
  constructor(private battles: BattlesService) {}

  @Query(() => [BattleModel])
  @UseGuards(JwtAuthGuard)
  myBattles(@CurrentUser() user: { userId: string }) {
    return this.battles.listBattles(user.userId);
  }

  @Query(() => [BattleModel])
  @UseGuards(JwtAuthGuard)
  activeBattles(@CurrentUser() user: { userId: string }) {
    return this.battles.resolveExpiredBattles().then(() =>
      this.battles.activeBattles(user.userId),
    );
  }

  @Query(() => PendingBattlesSummaryModel)
  @UseGuards(JwtAuthGuard)
  pendingBattlesSummary(@CurrentUser() user: { userId: string }) {
    return this.battles.pendingBattlesSummary(user.userId);
  }

  @Query(() => [BattleModel])
  @UseGuards(JwtAuthGuard)
  pendingBattles(@CurrentUser() user: { userId: string }) {
    return this.battles.pendingBattles(user.userId);
  }

  @Query(() => [BattleModel])
  @UseGuards(JwtAuthGuard)
  battleHistory(
    @CurrentUser() user: { userId: string },
    @Args('userId', { type: () => ID, nullable: true }) targetUserId?: string,
  ) {
    return this.battles.battleHistory(user.userId, targetUserId);
  }

  @Query(() => [BattleModel])
  @UseGuards(JwtAuthGuard)
  unseenBattleResults(@CurrentUser() user: { userId: string }) {
    return this.battles.unseenBattleResults(user.userId);
  }

  @Query(() => UserBattleStatsModel)
  @UseGuards(JwtAuthGuard)
  userBattleStats(
    @CurrentUser() user: { userId: string },
    @Args('userId', { type: () => ID, nullable: true }) targetUserId?: string,
  ) {
    return this.battles.getBattleStats(targetUserId ?? user.userId);
  }

  @Query(() => BattleModel)
  @UseGuards(JwtAuthGuard)
  battle(
    @CurrentUser() user: { userId: string },
    @Args('battleId', { type: () => ID }) battleId: string,
  ) {
    return this.battles.getBattle(user.userId, battleId);
  }

  @Mutation(() => BattleModel)
  @UseGuards(JwtAuthGuard)
  createBattle(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateBattleInput,
  ) {
    return this.battles.createBattle(user.userId, input);
  }

  @Mutation(() => BattleModel)
  @UseGuards(JwtAuthGuard)
  acceptBattle(
    @CurrentUser() user: { userId: string },
    @Args('battleId', { type: () => ID }) battleId: string,
  ) {
    return this.battles.acceptBattle(user.userId, battleId);
  }

  @Mutation(() => BattleModel)
  @UseGuards(JwtAuthGuard)
  declineBattle(
    @CurrentUser() user: { userId: string },
    @Args('battleId', { type: () => ID }) battleId: string,
  ) {
    return this.battles.declineBattle(user.userId, battleId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  markBattleResultsSeen(@CurrentUser() user: { userId: string }) {
    return this.battles.markBattleResultsSeen(user.userId);
  }
}
