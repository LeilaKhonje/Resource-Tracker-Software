
import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  // Get complete dashboard information
  @Get()
  @ApiOperation({ summary: 'Get dashboard information' })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary, recent audit activity, department spending, and departments.',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'object', properties: { totalRequests: { type: 'integer' }, pendingApprovals: { type: 'integer' }, approvedRequests: { type: 'integer' }, rejectedRequests: { type: 'integer' } } },
        recentActivity: { type: 'array', items: { type: 'object', additionalProperties: true } },
        departmentSpending: { type: 'array', items: { type: 'object', properties: { departmentId: { type: 'integer' }, departmentName: { type: 'string' }, totalSpending: { type: 'number' } } } },
        departments: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } } },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'An unexpected server error occurred.' })
  async getDashboard(
    @Query('departmentId') departmentId?: string,
  ) {
    return this.dashboardService.getDashboard(
      departmentId ? Number(departmentId) : undefined,
    );
  }

  // Get all departments
  @Get('departments')
  @ApiOperation({ summary: 'Get all departments for dashboard' })
  @ApiResponse({ status: 200, description: 'Departments available to the dashboard.', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } } } })
  @ApiResponse({ status: 500, description: 'An unexpected server error occurred.' })
  async getDepartments() {
    return this.dashboardService.getDepartments();
  }

  // Get dashboard information for one department
  @Get('departments/:departmentId')
  @ApiOperation({ summary: 'Get department dashboard details' })
  @ApiParam({ name: 'departmentId', type: Number })
  @ApiResponse({ status: 200, description: 'Department details and its request summary.', schema: { type: 'object', properties: { department: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } }, summary: { type: 'object', properties: { totalRequests: { type: 'integer' }, pendingApprovals: { type: 'integer' }, approvedRequests: { type: 'integer' }, rejectedRequests: { type: 'integer' } } } } } })
  @ApiResponse({ status: 400, description: 'Department ID must be an integer.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  @ApiResponse({ status: 500, description: 'An unexpected server error occurred.' })
  async getDepartmentDashboard(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.dashboardService.getDepartmentDashboard(departmentId);
  }
}
