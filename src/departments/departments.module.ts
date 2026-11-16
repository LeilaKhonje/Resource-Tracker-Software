import { Module } from '@nestjs/common';
import {TypeOrmModule}from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { User } from '../users/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, User, Team, Project, ResourceRequest]),
    AuthSecurityModule,
    EmailModule,
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports:[DepartmentsService]
})
export class DepartmentsModule {}
