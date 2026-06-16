import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RankingsService } from './rankings.service';
import { RankingCategory } from './rankings.models';

@Controller('api/rankings')
@UseGuards(JwtHttpAuthGuard)
export class RankingsController {
  constructor(private rankings: RankingsService) {}

  @Get()
  async getRankings(
    @Query('city') city: string | undefined,
    @Query('category') category: string,
    @CurrentUser() user: { userId: string },
  ) {
    const resolvedCity = city ?? (await this.rankings.getUserCity(user.userId));
    const cat = (category ?? 'bench') as RankingCategory;
    return this.rankings.getRankings(resolvedCity, cat, user.userId);
  }

  @Get('my-positions')
  async myPositions(@CurrentUser() user: { userId: string }) {
    return this.rankings.getMyPositions(user.userId);
  }
}
