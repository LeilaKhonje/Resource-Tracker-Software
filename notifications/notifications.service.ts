import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    userId: number,
    message: string,
  ) {

    const notification =
      this.notificationRepository.create({
        userId,
        message,
      });

    return this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: number) {
    return this.notificationRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
    });
  }
}