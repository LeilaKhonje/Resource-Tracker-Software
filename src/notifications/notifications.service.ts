import { Injectable,NotFoundException } from "@nestjs/common";
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Notification} from './notification.entity';

@Injectable()
export class NotificationsService{
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ){}
  async createNotification(
    userId:number,
    message:string,
  ): Promise<Notification>{
    const notification = this.notificationRepository.create({
      userId,
      message,
    });
    return this.notificationRepository.save(notification);
  
  }
  async getUserNotifications(
    userId: number,
  ):Promise<Notification[]>{
    return this.notificationRepository.find({
      where:{userId},
      order:{createdAt:'DESC'},
    });
  }
  async markAsRead(
    notificationId:number,
    userId:number,
  ): Promise<Notification>{
    const notification = await this.notificationRepository.findOne({
      where:{id: notificationId, userId},
     
    });
    if (!notification){
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }
  async deleteNotification(userId:number, notificationId:number){
    const notification =await this.notificationRepository.findOne({
      where:{
        id:notificationId,
        userId,
      },
    });
    if(!notification){
      throw new NotFoundException('Notification not found');
    }
    await this.notificationRepository.remove(notification);
    return{
      message:'Notification deleted successfully',
    };
  }
}
