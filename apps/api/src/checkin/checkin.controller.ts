import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CheckinService } from './checkin.service';
import { CreateCheckinInput, UpdatePrivacyInput } from './dto/checkin.input';

@Controller('api/checkins')
@UseGuards(JwtHttpAuthGuard)
export class CheckinController {
  constructor(private checkin: CheckinService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() body: CreateCheckinInput,
  ) {
    return this.checkin.checkin(
      user.userId,
      body.gymId,
      body.latitude,
      body.longitude,
      body.isPublic,
    );
  }

  @Get()
  list(@Query('city') city?: string) {
    return this.checkin.activeCheckins(city);
  }

  @Post(':id/react')
  react(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.checkin.reactToCheckin(user.userId, id);
  }
}

@Controller('api/privacy')
@UseGuards(JwtHttpAuthGuard)
export class PrivacyController {
  constructor(private checkin: CheckinService) {}

  @Get()
  get(@CurrentUser() user: { userId: string }) {
    return this.checkin.getPrivacy(user.userId);
  }

  @Patch()
  update(
    @CurrentUser() user: { userId: string },
    @Body() body: UpdatePrivacyInput,
  ) {
    return this.checkin.updatePrivacy(user.userId, body);
  }
}
