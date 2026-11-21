import { Body, BadRequestException, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {ApiBearerAuth,ApiBody,ApiOperation,ApiParam,ApiResponse, ApiTags,} from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '../common/swagger-response.decorators';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses(500)
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  // Get notifications for the authenticated user
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications for the authenticated user',
    schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, userId: { type: 'string', format: 'uuid' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({ status: 401, description: 'The authenticated user identity is missing.' })
  getMyNotifications(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.notificationsService.getUserNotifications(
      userId,
    );
  }

  // Get notifications using a user UUID
  @Get('users/:id')
  @ApiOperation({
    summary: 'Get notifications for a user ID',
    description: 'This route does not declare an authentication guard; it returns notifications for the supplied user UUID.',
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
    schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, userId: { type: 'string', format: 'uuid' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } },
  })
  getUserNotifications(@Param('id') id: string) {
    return this.notificationsService.getUserNotifications(id);
  }

  // Mark a notification as read
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read for a user',
    description: 'This route does not declare an authentication guard. Supply the owning user UUID in the body.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the notification',
    type: String,
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
    schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, userId: { type: 'string', format: 'uuid' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } },
  })
  @ApiResponse({ status: 400, description: 'Notification ID or userId was not supplied.' })
  @ApiResponse({
    status: 404,
    description: 'Notification not found for the supplied user ID',
  })
  markAsRead(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    if (!id || !body?.userId) {
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
    description: 'This route does not declare an authentication guard. Creates an unread notification for the supplied user UUID.',
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
    schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, userId: { type: 'string', format: 'uuid' }, message: { type: 'string' }, isRead: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } },
  })
  @ApiResponse({ status: 400, description: 'userId and message are required.' })
  createNotification(
    @Body() body: { userId: string; message: string },
  ) {
    if (!body?.userId || !body?.message) {
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
    description: 'This route does not declare an authentication guard. Deletes the notification only when it belongs to the supplied user UUID.',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID of the user',
    type: String,
  })
  @ApiParam({
    name: 'notificationId',
    description: 'UUID of the notification',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion result',
    schema: { type: 'object', properties: { message: { type: 'string', example: 'Notification deleted successfully' } } },
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
