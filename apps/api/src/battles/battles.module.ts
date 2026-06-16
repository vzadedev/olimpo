import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { BattlesResolver } from './battles.resolver';
import { BattlesController, UserBattleStatsController } from './battles.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule],
  providers: [BattlesService, BattlesResolver],
  controllers: [BattlesController, UserBattleStatsController],
  exports: [BattlesService],
})
export class BattlesModule {}
