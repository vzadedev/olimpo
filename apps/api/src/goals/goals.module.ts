import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsResolver } from './goals.resolver';
import { BadgesController, GoalsController } from './goals.controller';

@Module({
  providers: [GoalsService, GoalsResolver],
  controllers: [GoalsController, BadgesController],
  exports: [GoalsService],
})
export class GoalsModule {}
