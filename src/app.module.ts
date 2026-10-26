import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
// cspell:ignore resourcerequest
import { ResourcerequestModule } from './resourcerequest/resourcerequest.module';
import { DepartmentsModule } from './departments/departments.module';
import { TeamsModule } from './teams/teams.module';
import { LineManagerDashboardModule } from './line-manager-dashboard/line-manager-dashboard.module';


@Module({
  imports: 
    [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: process.env.DB_CONNECTION as any,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true', 
    }),

    AuthModule,
    NotificationsModule,
    ResourcerequestModule,
    NotificationsModule,
    DepartmentsModule,
    TeamsModule,

    LineManagerDashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
