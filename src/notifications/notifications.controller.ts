
import {Body,BadRequestException,Controller,Delete,Get,Param,ParseIntPipe,Patch, Post, Req} from '@nestjs/common';
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
  @ApiResponse({ status: 200, description: 'Notifications for the authenticated user', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, userId: { type: 'integer' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } } })
  @ApiResponse({ status: 401, description: 'Request must include an authenticated user' })
  getMyNotifications(@Req() req: any) {
    return this.notificationsService.getUserNotifications(
      req.user.id,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: Number })
  @ApiResponse({ status: 200, description: 'Notifications for the path user ID; current handler does not mark a notification read', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, userId: { type: 'integer' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } } })
  @Get(':id')
  @ApiOperation({ summary: 'Get notifications for a user ID' })
  @ApiParam({ name: 'id', description: 'Numeric user ID', type: Number })
  @ApiResponse({ status: 200, description: 'Notifications for the specified user ID', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, userId: { type: 'integer' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } } })
  getUserNotifications(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.getUserNotifications(id);
  }

  @Patch('read/:id')
  @ApiOperation({ summary: 'Mark a notification as read for a user' })
  @ApiParam({ name: 'id', description: 'Numeric notification ID', type: Number })
  @ApiBody({ schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'integer', example: 15 } } } })
  @ApiResponse({ status: 200, description: 'Updated notification', schema: { type: 'object', properties: { id: { type: 'integer' }, userId: { type: 'integer' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } })
  @ApiResponse({ status: 404, description: 'Notification not found for the supplied user ID' })
  @ApiResponse({ status: 400, description: 'Notification ID must be an integer and userId is required' })
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
  @ApiResponse({ status: 201, description: 'Created notification', schema: { type: 'object', properties: { id: { type: 'integer' }, userId: { type: 'integer' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } })
  @ApiResponse({ status: 400, description: 'userId and message are required' })
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
  @ApiOperation({ summary: 'Delete a user notification' })
  @ApiParam({ name: 'userId', description: 'Numeric user ID', type: Number })
  @ApiParam({ name: 'notificationId', description: 'Numeric notification ID', type: Number })
  @ApiResponse({ status: 200, description: 'Deletion result', schema: { type: 'object', properties: { message: { type: 'string', example: 'Notification deleted successfully' } } } })
  @ApiResponse({ status: 404, description: 'Notification not found for the supplied user ID' })
  @ApiResponse({ status: 400, description: 'Both path IDs must be integers' })
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
