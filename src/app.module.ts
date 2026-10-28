import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ResourcerequestModule } from './resourcerequest/resourcerequest.module';
import { DepartmentsModule } from './departments/departments.module';
import { TeamsModule } from './teams/teams.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectsModule } from './projects/projects.module';
import { AuditLogsModule } from './auditlog/auditlog.module';
import { ReportsModule } from './reports/reports.module';
import { ResourcesModule } from './resources/resources.module';


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
    ResourcerequestModule,
    NotificationsModule,
    DepartmentsModule,
    TeamsModule,
    DashboardModule,
    ProjectsModule,
    AuditLogsModule,
    ReportsModule,
    ResourcesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
