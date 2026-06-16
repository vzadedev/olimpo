import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BattlesService } from './battles.service';
import { CreateBattleInput } from './dto/battles.input';

@Controller('api/battles')
@UseGuards(JwtHttpAuthGuard)
export class BattlesController {
  constructor(private battles: BattlesService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.battles.listBattles(user.userId);
  }

  @Get('pending')
  pending(@CurrentUser() user: { userId: string }) {
    return this.battles.pendingBattles(user.userId);
  }

  @Get('active')
  active(@CurrentUser() user: { userId: string }) {
    return this.battles.resolveExpiredBattles().then(() =>
      this.battles.activeBattles(user.userId),
    );
  }

  @Get('results/unseen')
  unseenResults(@CurrentUser() user: { userId: string }) {
    return this.battles.unseenBattleResults(user.userId);
  }

  @Get('history')
  history(
    @CurrentUser() user: { userId: string },
    @Query('userId') targetUserId?: string,
  ) {
    return this.battles.battleHistory(user.userId, targetUserId);
  }

  @Get(':id')
  get(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.battles.getBattle(user.userId, id);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() body: CreateBattleInput,
  ) {
    return this.battles.createBattle(user.userId, body);
  }

  @Patch(':id/accept')
  accept(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.battles.acceptBattle(user.userId, id);
  }

  @Patch(':id/decline')
  decline(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.battles.declineBattle(user.userId, id);
  }
}

@Controller('api/users')
@UseGuards(JwtHttpAuthGuard)
export class UserBattleStatsController {
  constructor(private battles: BattlesService) {}

  @Get(':id/battle-stats')
  stats(@Param('id') id: string) {
    return this.battles.getBattleStats(id);
  }
}
