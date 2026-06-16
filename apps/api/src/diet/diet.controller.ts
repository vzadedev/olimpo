import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DietService } from './diet.service';
import { CreateMealInput } from './dto/diet.input';

@Controller('api/diet')
@UseGuards(JwtHttpAuthGuard)
export class DietController {
  constructor(private diet: DietService) {}

  @Post('analyze')
  analyze(
    @CurrentUser() user: { userId: string },
    @Body() body: {
      imageBase64: string;
      mediaType?: string;
      userNote?: string;
      mealType?: string;
    },
  ) {
    return this.diet.analyzeImage(
      user.userId,
      body.imageBase64,
      body.mediaType ?? 'image/jpeg',
      body.userNote,
      body.mealType,
    );
  }

  @Get('today')
  today(
    @CurrentUser() user: { userId: string },
    @Query('date') date?: string,
  ) {
    return this.diet.getDashboard(user.userId, date);
  }

  @Get('history')
  history(
    @CurrentUser() user: { userId: string },
    @Query('days') days?: string,
  ) {
    const d = parseInt(days ?? '7', 10);
    if (d <= 7) return this.diet.getWeeklySummary(user.userId);
    return this.diet.getWeeklySummary(user.userId);
  }

  @Post('meals')
  createMeal(
    @CurrentUser() user: { userId: string },
    @Body() body: CreateMealInput,
  ) {
    return this.diet.createMeal(user.userId, body);
  }
}
