import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
// cspell:ignore resourcerequest
import { ResourcerequestModule } from './resourcerequest/resourcerequest.module';
import { DepartmentsModule } from './departments/departments.module';
import { TeamsModule } from './teams/teams.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { AuditLogModule } from './auditlog/auditlog.module';
import { ResourcesModule } from './resources/resources.module';
import { UsersModule } from './users/users.module';
//import { ResourceAllocationModule } from './resource-allocation/resource-allocation.module';

@Module({
  imports: [
  ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: process.env.DB_CONNECTION as any,          
      host:process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME,       
      password:  process.env.DB_PASSWORD, 
      database:  process.env.DB_DATABASE, 
      autoLoadEntities: true,    
      synchronize: true,         
    }),

    AuthModule,
    UsersModule,
    NotificationsModule,
    ResourcerequestModule,
    DepartmentsModule,
    TeamsModule,
    DashboardModule,
    ProjectsModule,
    AuditLogModule,
    ReportsModule,
    ResourcesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
