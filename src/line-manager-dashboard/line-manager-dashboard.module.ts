import { Module } from '@nestjs/common';
import { LineManagerDashboardService } from './line-manager-dashboard.service';
import { LineManagerDashboardController } from './line-manager-dashboard.controller';
import { DepartmentsModule } from '../departments/departments.module';
import { ResourceAllocationModule } from '../resource-allocation/resource-allocation.module';

@Module({
  imports: [ DepartmentsModule, ResourceAllocationModule ],
  providers: [LineManagerDashboardService],
  controllers: [LineManagerDashboardController]
})
export class LineManagerDashboardModule {}
