
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuditLogService } from './auditlog.service';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@ApiTags('Audit Logs')
@Controller('api/v1/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SYSTEM_ADMIN,
  UserRole.DEPARTMENT_HEAD,
  UserRole.MANAGING_DIRECTOR,
)
@ApiBearerAuth('access-token')
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogService,
  ) {}

  @ApiOperation({
    summary: 'Get audit logs using optional filters',
    description:
      'All filters are optional. You can provide one or multiple filters. When multiple filters are provided, OR logic is used, meaning a record matching ANY supplied filter is returned. If no filters are provided, all audit logs are returned.',
  })

  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filter by user ID',
    example: 1,
  })

  @ApiQuery({
    name: 'actionType',
    required: false,
    type: String,
    description: 'Filter by action type',
    example: 'DELETE',
  })

  @ApiQuery({
    name: 'entityType',
    required: false,
    type: String,
    description: 'Filter by entity type',
    example: 'ResourceRequest',
  })

  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filter by date (YYYY-MM-DD)',
    example: '2026-11-12',
  })

  @ApiQuery({
    name: 'time',
    required: false,
    type: String,
    description: 'Filter by time (HH:mm)',
    example: '13:30',
  })

  @ApiResponse({
    status: 200,
    description: 'Filtered audit log records',
  })

  @Get('')
  getAllLogs(
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('entityType') entityType?: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
  ) {
    return this.auditLogsService.getAllLogs({
      userId,
      actionType,
      entityType,
      date,
      time,
    });
  }

  @ApiOperation({
    summary: 'Get audit logs for a specific record',
  })

  @ApiResponse({
    status: 200,
    description: 'Matching audit log records',
  })

  @ApiResponse({
    status: 400,
    description: 'entityId must be an integer',
  })

  @Get('record/:entityType/:entityId')
  @ApiParam({
    name: 'entityType',
    description: 'Type of the audited entity',
  })

  @ApiParam({
    name: 'entityId',
    description: 'ID of the audited record',
    type: Number,
  })

  getLogsForRecord(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.auditLogsService.getLogsForRecord(
      entityType,
      entityId,
    );
  }
}
