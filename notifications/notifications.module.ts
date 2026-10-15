<<<<<<< Updated upstream:notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
=======
import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {NotificationsService} from './notifications.service';
import {Notification} from './notification.entity';
import { NotificationsController } from './notifications.controller';

@Module({
  imports:[TypeOrmModule.forFeature([Notification])],
  controllers:[NotificationsController],
  providers:[NotificationsService ],
  exports:[NotificationsService],
})
export class NotificationsModule{}
>>>>>>> Stashed changes:src/notifications/notifications.module.ts
