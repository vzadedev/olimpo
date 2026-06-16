import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CityRankingsResultModel,
  MyRankingPositionModel,
  RankingCategory,
} from './rankings.models';
import { RankingsService } from './rankings.service';

@Resolver()
export class RankingsResolver {
  constructor(private rankings: RankingsService) {}

  @Query(() => CityRankingsResultModel)
  @UseGuards(JwtAuthGuard)
  cityRankings(
    @CurrentUser() user: { userId: string },
    @Args('category', { type: () => RankingCategory }) category: RankingCategory,
    @Args('city', { nullable: true }) city?: string,
  ) {
    return this.rankings
      .getUserCity(user.userId)
      .then((userCity) =>
        this.rankings.getRankings(city ?? userCity, category, user.userId),
      );
  }

  @Query(() => [MyRankingPositionModel])
  @UseGuards(JwtAuthGuard)
  myRankingPositions(@CurrentUser() user: { userId: string }) {
    return this.rankings.getMyPositions(user.userId);
  }
}
