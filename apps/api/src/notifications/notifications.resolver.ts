import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationModel } from '../posts/posts.models';
import { NotificationsService } from './notifications.service';

@Resolver()
export class NotificationsResolver {
  constructor(private notifications: NotificationsService) {}

  @Query(() => [NotificationModel])
  @UseGuards(JwtAuthGuard)
  myNotifications(@CurrentUser() user: { userId: string }) {
    return this.notifications.list(user.userId);
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  unreadNotificationCount(@CurrentUser() user: { userId: string }) {
    return this.notifications.unreadCount(user.userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  markNotificationsRead(
    @CurrentUser() user: { userId: string },
    @Args('ids', { type: () => [String], nullable: true }) ids?: string[],
  ) {
    return this.notifications.markRead(user.userId, ids).then(() => true);
  }
}
