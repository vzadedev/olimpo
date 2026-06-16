import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { GamificationModule } from '../gamification/gamification.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [GamificationModule, GoalsModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
