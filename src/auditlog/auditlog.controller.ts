
import {Controller,Get,Query,UseGuards,} from '@nestjs/common';
import { AuditLogService } from './auditlog.service';
import {ApiTags,ApiOperation,ApiResponse,ApiBearerAuth,ApiQuery,} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { ApiStandardErrorResponses } from '../common/swagger-response.decorators';

@ApiTags('Audit Logs')
@ApiStandardErrorResponses(401, 403, 500)
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

  // GET 1: Retrieve all audit logs
  @Get()
  @ApiOperation({
    summary: 'Get all audit logs',
    description: 'Retrieves all audit logs without filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'All audit logs retrieved successfully',
    schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, actionType: { type: 'string' }, entityType: { type: 'string' }, userId: { type: 'string', nullable: true }, entityId: { type: 'string', nullable: true }, details: { type: 'string', nullable: true }, requestId: { type: 'string', nullable: true }, action: { type: 'string', nullable: true }, performedBy: { type: 'string', nullable: true }, note: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } } },
  })
  getAllLogs() {
    return this.auditLogsService.getAllLogs();
  }

  // GET 2: Filter audit logs using OR logic
  @Get('filter')
  @ApiOperation({
    summary: 'Filter audit logs',
    description:
      'All filters are optional. Multiple filters use OR logic, meaning a record matching ANY supplied criterion is returned. Date and time are treated as one combined criterion when both are supplied.',
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
    example: '2026-11-16',
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
    description: 'Filtered audit logs retrieved successfully',
    schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, actionType: { type: 'string' }, entityType: { type: 'string' }, userId: { type: 'string', nullable: true }, entityId: { type: 'string', nullable: true }, details: { type: 'string', nullable: true }, requestId: { type: 'string', nullable: true }, action: { type: 'string', nullable: true }, performedBy: { type: 'string', nullable: true }, note: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } } },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid filter value',
  })
  filterLogs(
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('entityType') entityType?: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
  ) {
    return this.auditLogsService.filterLogs({
      userId,
      actionType,
      entityType,
      date,
      time,
    });
  }
}

