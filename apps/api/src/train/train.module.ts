import { Module } from '@nestjs/common';
import { TrainService } from './train.service';
import { TrainResolver } from './train.resolver';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  providers: [TrainService, TrainResolver],
})
export class TrainModule {}
