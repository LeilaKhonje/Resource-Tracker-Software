import {Controller,Get,Param,Patch,} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {

  constructor(
    private notificationsService: NotificationsService,
  ) {}

  @Get(':userId')
  getUserNotifications(
    @Param('userId') userId: string,
  ) {

    return this.notificationsService
      .getUserNotifications(+userId);
  }
}