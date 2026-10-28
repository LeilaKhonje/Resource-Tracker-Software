
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
  @ApiResponse({ status: 200, description: 'Dashboard data', schema: { type: 'object', properties: { summary: { type: 'object', properties: { totalRequests: { type: 'integer' }, pendingApprovals: { type: 'integer' }, approvedRequests: { type: 'integer' }, rejectedRequests: { type: 'integer' }, allocatedResources: { type: 'integer' } } }, recentActivity: { type: 'array', items: { type: 'object', additionalProperties: true } }, departmentSpending: { type: 'array', items: { type: 'object', properties: { departmentId: { type: 'integer' }, departmentName: { type: 'string' }, totalSpending: { type: 'number' } } } } } } })
  @ApiResponse({ status: 500, description: 'Invalid departmentId currently raises a generic server error' })
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
  @ApiResponse({ status: 200, description: 'Summary metrics', schema: { type: 'object', properties: { totalRequests: { type: 'integer' }, pendingApprovals: { type: 'integer' }, approvedRequests: { type: 'integer' }, rejectedRequests: { type: 'integer' }, allocatedResources: { type: 'integer' } } } })
  @ApiResponse({ status: 500, description: 'Invalid departmentId currently raises a generic server error' })
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
  @ApiResponse({ status: 200, description: 'Recent audit log rows', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, actionType: { type: 'string' }, entityType: { type: 'string' }, details: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' } }, additionalProperties: true } } })
  @ApiResponse({ status: 400, description: 'limit must be an integer' })
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('department-spending')
  @ApiOperation({ summary: 'Get spending by department' })
  @ApiResponse({ status: 200, description: 'Department spending rows', schema: { type: 'array', items: { type: 'object', properties: { departmentId: { type: 'integer' }, departmentName: { type: 'string' }, totalSpending: { type: 'number' } } } } })
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
