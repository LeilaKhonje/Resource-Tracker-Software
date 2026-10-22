import { Module } from '@nestjs/common';
import { LineManagerDashboardService } from './line-manager-dashboard.service';
import { LineManagerDashboardController } from './line-manager-dashboard.controller';
//import { Department } from '../departments/entities/department.entity';
//import { ResourceAllocation } from '../resource-allocation/entities/resource-allocation.entity';
import { ResourceAllocationModule } from '../resource-allocation/resource-allocation.module';

@Module({
  imports: [ ResourceAllocationModule ],
  providers: [LineManagerDashboardService],
  controllers: [LineManagerDashboardController]
})
export class LineManagerDashboardModule {}
