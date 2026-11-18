
import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuditLogService } from './auditlog.service';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
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

  @Get()
  @ApiOperation({
    summary: 'Get all or filter audit logs',
    description:
      'Returns all audit logs when no filters are provided. When filters are supplied, returns records matching ANY of the provided filters (OR logic).',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'actionType', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-11-16',
  })
  @ApiQuery({
    name: 'time',
    required: false,
    type: String,
    example: '13:30',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid filter value',
  })
  getLogs(
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('entityType') entityType?: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
  ) {
    return this.auditLogsService.getLogs({
      userId,
      actionType,
      entityType,
      date,
      time,
    });
  }
}
