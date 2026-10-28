
import {Controller, Get, Query, ParseIntPipe, DefaultValuePipe} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard data' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number, description: 'Restrict dashboard data to a department' })
  @ApiResponse({ status: 200, description: 'Dashboard data returned' })
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
  @ApiOperation({ summary: 'Get dashboard summary metrics' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Summary metrics returned' })
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
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of activity entries (defaults to 10)' })
  @ApiResponse({ status: 200, description: 'Recent activity returned' })
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('department-spending')
  @ApiOperation({ summary: 'Get spending by department' })
  @ApiResponse({ status: 200, description: 'Department spending returned' })
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
