
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
  async getDepartments() {
    return this.dashboardService.getDepartments();
  }

  // Get dashboard information for one department
  @Get('departments/:departmentId')
  @ApiOperation({ summary: 'Get department dashboard details' })
  @ApiParam({ name: 'departmentId', type: Number })
  async getDepartmentDashboard(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.dashboardService.getDepartmentDashboard(departmentId);
  }
}
