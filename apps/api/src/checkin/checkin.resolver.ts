import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CheckinModel, PrivacySettingsModel } from './checkin.models';
import { CreateCheckinInput, UpdatePrivacyInput } from './dto/checkin.input';
import { CheckinService } from './checkin.service';

@Resolver()
export class CheckinResolver {
  constructor(private checkin: CheckinService) {}

  @Query(() => PrivacySettingsModel)
  @UseGuards(JwtAuthGuard)
  myPrivacySettings(@CurrentUser() user: { userId: string }) {
    return this.checkin.getPrivacy(user.userId);
  }

  @Mutation(() => PrivacySettingsModel)
  @UseGuards(JwtAuthGuard)
  updatePrivacySettings(
    @CurrentUser() user: { userId: string },
    @Args('input') input: UpdatePrivacyInput,
  ) {
    return this.checkin.updatePrivacy(user.userId, input);
  }

  @Mutation(() => CheckinModel)
  @UseGuards(JwtAuthGuard)
  async createCheckin(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateCheckinInput,
  ) {
    const c = await this.checkin.checkin(
      user.userId,
      input.gymId,
      input.latitude,
      input.longitude,
      input.isPublic,
    );
    return {
      id: c.id,
      gymName: c.gym.name,
      checkedInAt: c.checkedInAt,
      expiresAt: c.expiresAt,
      isPublic: c.isPublic,
      userName: c.user.name ?? 'Atleta',
      userAvatarUrl: c.user.avatarUrl ?? undefined,
      reactionCount: 0,
    };
  }

  @Query(() => [CheckinModel])
  @UseGuards(JwtAuthGuard)
  async activeCheckins(@Args('city', { nullable: true }) city?: string) {
    const list = await this.checkin.activeCheckins(city);
    return list.map((c) => ({
      id: c.id,
      gymName: c.gym.name,
      checkedInAt: c.checkedInAt,
      expiresAt: c.expiresAt,
      isPublic: c.isPublic,
      userName: c.user.name ?? 'Atleta',
      userAvatarUrl: c.user.avatarUrl ?? undefined,
      reactionCount: c._count.reactions,
    }));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  reactToCheckin(
    @CurrentUser() user: { userId: string },
    @Args('checkinId', { type: () => ID }) checkinId: string,
  ) {
    return this.checkin.reactToCheckin(user.userId, checkinId).then(() => true);
  }
}
