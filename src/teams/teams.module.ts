import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { AuthSecurityModule } from '../auth/auth-security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Department, User, Project, ResourceRequest]),
    AuthSecurityModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
