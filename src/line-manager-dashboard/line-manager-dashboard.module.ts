import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineManagerDashboardService } from './line-manager-dashboard.service';
import { LineManagerDashboardController } from './line-manager-dashboard.controller';
//import { Department } from '../departments/entities/department.entity';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
//import { ResourcerequestModule } from '../resourcerequest/resourcerequest.module';

@Module({
  imports: [ TypeOrmModule.forFeature([ResourceRequest]) ],
  providers: [LineManagerDashboardService],
  controllers: [LineManagerDashboardController]
})
export class LineManagerDashboardModule {}
