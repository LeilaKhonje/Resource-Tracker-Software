import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/user.entity';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Team, User]),
    AuthSecurityModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, ProjectsModule],
})
export class ProjectsModule {}
