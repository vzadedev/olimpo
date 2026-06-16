import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsResolver } from './rankings.resolver';
import { RankingsController } from './rankings.controller';

@Module({
  providers: [RankingsService, RankingsResolver],
  controllers: [RankingsController],
  exports: [RankingsService],
})
export class RankingsModule {}
