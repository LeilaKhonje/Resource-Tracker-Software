
import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  // Get notifications for the authenticated user
  @Get('me')
  @ApiOperation({
    summary: 'Get notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications for the authenticated user',
  })
  @ApiResponse({
    status: 401,
    description: 'Request must include an authenticated user',
  })
  getMyNotifications(@Req() req: any) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('Authenticated user not found');
    }

    return this.notificationsService.getUserNotifications(
      req.user.id,
    );
  }

  // Get notifications using a user UUID
  @Get('users/:id')
  @ApiOperation({
    summary: 'Get notifications for a user ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user',
    type: String,
    example: '584ef94b-a106-4f23-8120-ab07a4091d0b',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications for the specified user',
  })
  getUserNotifications(@Param('id') id: string) {
    return this.notificationsService.getUserNotifications(id);
  }

  // Mark a notification as read
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read for a user',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the notification',
    type: String,
    example: '584ef94b-a106-4f23-8120-ab07a4091d0b',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          type: 'string',
          example: '28e6826d-c5c9-40b4-8c7a-98793e110321',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Updated notification',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found for the supplied user ID',
  })
  @ApiResponse({
    status: 400,
    description: 'Notification ID and userId are required',
  })
  markAsRead(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    if (!id || !body || !body.userId) {
      throw new BadRequestException(
        'Please provide notification ID and userId',
      );
    }

    return this.notificationsService.markAsRead(
      id,
      body.userId,
    );
  }

  // Create a notification
  @Post()
  @ApiOperation({
    summary: 'Create a notification',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'message'],
      properties: {
        userId: {
          type: 'string',
          example: '28e6826d-c5c9-40b4-8c7a-98793e110321',
        },
        message: {
          type: 'string',
          example: 'Your resource request has been approved',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Created notification',
  })
  @ApiResponse({
    status: 400,
    description: 'userId and message are required',
  })
  createNotification(
    @Body() body: { userId: string; message: string },
  ) {
    if (!body || !body.userId || !body.message) {
      throw new BadRequestException(
        'Please provide userId and message',
      );
    }

    return this.notificationsService.createNotification(
      body.userId,
      body.message,
    );
  }

  // Delete a notification
  @Delete('users/:userId/notifications/:notificationId')
  @ApiOperation({
    summary: 'Delete a user notification',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID of the user',
    type: String,
    example: '28e6826d-c5c9-40b4-8c7a-98793e110321',
  })
  @ApiParam({
    name: 'notificationId',
    description: 'UUID of the notification',
    type: String,
    example: '584ef94b-a106-4f23-8120-ab07a4091d0b',
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion result',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found for the supplied user ID',
  })
  deleteNotification(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(
      userId,
      notificationId,
    );
  }
}
