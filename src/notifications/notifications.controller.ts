
import {Body,BadRequestException,Controller,Delete,Get,Param,ParseIntPipe,Patch, Post,} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get(':id')
  getUserNotifications(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.getUserNotifications(id);
  }

  @Patch('read/:id')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number },
  ) {
    if (!body || body.userId === undefined) {
      throw new BadRequestException(
        'Please provide userId in the request body',
      );
    }

    return this.notificationsService.markAsRead(
      id,
      body.userId,
    );
  }

  @Post()
  createNotification(
    @Body() body: { userId: number; message: string },
  ) {
    if (!body || body.userId === undefined || !body.message) {
      throw new BadRequestException(
        'Please provide userId and message',
      );
    }

    return this.notificationsService.createNotification(
      body.userId,
      body.message,
    );
  }

  @Delete(':userId/:notificationId')
  deleteNotification(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('notificationId', ParseIntPipe)
    notificationId: number,
  ) {
    return this.notificationsService.deleteNotification(
      userId,
      notificationId,
    );
  }
}
