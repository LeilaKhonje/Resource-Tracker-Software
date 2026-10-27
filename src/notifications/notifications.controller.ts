
import {Body,BadRequestException,Controller,Delete,Get,Param,ParseIntPipe,Patch, Post,} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'User notifications returned' })
  getMyNotifications(@Req() req: any) {
    return this.notificationsService.getUserNotifications(
      req.user.id,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: Number })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
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
  @ApiOperation({ summary: 'Create a notification' })
  @ApiBody({ schema: { type: 'object', required: ['userId', 'message'], properties: { userId: { type: 'integer' }, message: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Notification created' })
  createNotification(
    @Body() body: { userId: number; message: string },
  ) {
    if (!body || body.userId === undefined || !body.message) {
      throw new BadRequestException(
        'Please provide userId and message',
      );
    }
     @Delete(':userId/:notificationId')
     @ApiOperation({ summary: 'Delete a notification for a user' })
     @ApiParam({ name: 'userId', description: 'User ID', type: Number })
     @ApiParam({ name: 'notificationId', description: 'Notification ID', type: Number })
     @ApiResponse({ status: 200, description: 'Notification deleted' })

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
