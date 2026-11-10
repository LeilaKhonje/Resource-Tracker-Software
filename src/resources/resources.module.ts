import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resources } from './entities/resources.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { Department } from '../departments/entities/department.entity';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { ResourceAllocation } from './entities/resource-allocation.entity';
import { ResourceMovement } from './entities/resource-movement.entity';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resources,
      Department,
      ResourceAllocation,
      ResourceMovement,
      ResourceRequest,
      Team,
      Project,
      User,
    ]),
    AuthSecurityModule,
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
