
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // Create a notification
  async createNotification(
    userId: string,
    message: string,
  ): Promise<Notification> {
    if (!userId || !message) {
      throw new BadRequestException('User ID and message are required');
    }

    const notification = this.notificationRepository.create({
      userId,
      message,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  // Get all notifications belonging to a user
  async getUserNotifications(
    userId: string,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Mark a notification as read
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;

    return this.notificationRepository.save(notification);
  }

  // Delete a notification
  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);

    return {
      message: 'Notification deleted successfully',
    };
  }
}
