import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsResolver } from './notifications.resolver';

@Global()
@Module({
  providers: [NotificationsService, NotificationsResolver],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
