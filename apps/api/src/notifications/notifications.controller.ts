import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtHttpAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.notifications.list(user.userId);
  }

  @Patch('read-all')
  readAll(@CurrentUser() user: { userId: string }) {
    return this.notifications.markRead(user.userId).then(() => ({ ok: true }));
  }
}
