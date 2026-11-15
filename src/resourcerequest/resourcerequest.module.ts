import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcerequestController } from './resourcerequest.controller';
import { ResourcerequestService } from './resourcerequest.service';
import { ResourceRequest } from './entities/resourcerequest.entity';
import { AuditLog } from '../auditlog/auditlog.entity';
import { Department } from '../departments/entities/department.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { RequestAuditLog } from './entities/request-audit-log.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResourceRequest, AuditLog, Department, Team, Project, User]),
    AuthSecurityModule,
    NotificationsModule,
  ],
  controllers: [ResourcerequestController],
  providers: [ResourcerequestService],
  exports: [ResourcerequestService],
})
export class ResourcerequestModule {}
