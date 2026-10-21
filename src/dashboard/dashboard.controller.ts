
import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  getDashboard(
    @Query('departmentId') departmentId?: string,
  ) {
    return this.dashboardService.getDashboard(
      departmentId === undefined
        ? undefined
        : this.parseDepartmentId(departmentId),
    );
  }

  @Get('summary')
  getSummary(
    @Query('departmentId') departmentId?: string,
  ) {
    return this.dashboardService.getSummary(
      departmentId === undefined
        ? undefined
        : this.parseDepartmentId(departmentId),
    );
  }

  @Get('recent-activity')
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('department-spending')
  getDepartmentSpending() {
    return this.dashboardService.getDepartmentSpending();
  }

  private parseDepartmentId(value: string): number {
    const id = Number(value);

    if (!Number.isInteger(id) || id < 1) {
      throw new Error('departmentId must be a positive integer');
    }

    return id;
  }
}
