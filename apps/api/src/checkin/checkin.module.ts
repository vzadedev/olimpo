import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinResolver } from './checkin.resolver';
import { CheckinController, PrivacyController } from './checkin.controller';

@Module({
  providers: [CheckinService, CheckinResolver],
  controllers: [CheckinController, PrivacyController],
  exports: [CheckinService],
})
export class CheckinModule {}
