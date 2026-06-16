import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GoalsService } from './goals.service';
import { CreateGoalInput, UpdateGoalInput } from './dto/goal.inputs';

@Controller('api/goals')
@UseGuards(JwtHttpAuthGuard)
export class GoalsController {
  constructor(private goals: GoalsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.goals.listGoals(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() body: CreateGoalInput,
  ) {
    return this.goals.createGoal(user.userId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: UpdateGoalInput,
  ) {
    return this.goals.updateGoal(user.userId, id, body);
  }
}

@Controller('api/badges')
@UseGuards(JwtHttpAuthGuard)
export class BadgesController {
  constructor(private goals: GoalsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.goals.listBadges(user.userId);
  }
}
