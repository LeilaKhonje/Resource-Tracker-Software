
import {Body,Controller,Delete,Get,Param,ParseIntPipe,  Patch, Post, Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  getMyNotifications(@Req() req: any) {
    return this.notificationsService.getUserNotifications(
      req.user.id,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.notificationsService.markAsRead(
      id,
      req.user.id,
    );
  }
  @Post()
  createNotification(
    @Body() body:{userId:number,message:string},){
      return this.notificationsService.createNotification(
        body.userId,body.message,
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
