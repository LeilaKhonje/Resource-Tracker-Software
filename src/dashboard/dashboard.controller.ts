import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

const DASHBOARD_ROLES = [
  UserRole.SYSTEM_ADMIN,
  UserRole.MANAGING_DIRECTOR,
  UserRole.DEPARTMENT_HEAD,
  UserRole.LINE_MANAGER,
];

@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...DASHBOARD_ROLES)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get role-scoped dashboard information',
    description:
      'System Admins and Managing Directors receive system-wide dashboard data. Line Managers receive only requests routed to them. Department Heads receive only requests in their department.',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: Number,
    description: 'Optional summary filter for System Admins and Managing Directors. It does not change role-scoped request results.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Line Managers and Department Heads receive a requests array. System Admins and Managing Directors receive system-wide summaries, recent activity, spending, and departments.',
    schema: { type: 'object', additionalProperties: true },
  })
  async getDashboard(
    @Query('departmentId') departmentId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.dashboardService.getDashboard(
      request.user!,
      departmentId ? Number(departmentId) : undefined,
    );
  }

  @Get('departments')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGING_DIRECTOR)
  @ApiOperation({
    summary: 'Get all departments for dashboard',
    description: 'System Admins and Managing Directors can view all department records.',
  })
  @ApiResponse({
    status: 200,
    description: 'Departments available to the dashboard.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          code: { type: 'string', nullable: true },
          description: { type: 'string' },
        },
      },
    },
  })
  async getDepartments() {
    return this.dashboardService.getDepartments();
  }

  @Get('departments/:departmentId')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGING_DIRECTOR)
  @ApiOperation({
    summary: 'Get department dashboard details',
    description:
      'System Admins and Managing Directors can view a department record and its request summary.',
  })
  @ApiParam({ name: 'departmentId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Department details and its request summary.',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiResponse({ status: 400, description: 'Department ID must be an integer.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  async getDepartmentDashboard(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.dashboardService.getDepartmentDashboard(departmentId);
  }
}
