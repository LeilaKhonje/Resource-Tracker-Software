
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

  @Get()
  @ApiOperation({
    summary: 'Get all or filter audit logs',
    description:
      'Returns all audit logs when no filters are provided. When filters are supplied, returns records matching ANY of the provided filters (OR logic).',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Positive numeric user ID. Filters are combined with OR when more than one is supplied.' })
  @ApiQuery({ name: 'actionType', required: false, type: String, description: 'Exact action type; combined with other supplied filters using OR.' })
  @ApiQuery({ name: 'entityType', required: false, type: String, description: 'Exact entity type; combined with other supplied filters using OR.' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-11-16',
    description: 'Creation date in YYYY-MM-DD format; combined with other supplied filters using OR.',
  })
  @ApiQuery({
    name: 'time',
    required: false,
    type: String,
    example: '13:30',
    description: 'Creation time in HH:mm format; combined with other supplied filters using OR.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log rows ordered newest first. If no filters are supplied, all rows are returned.',
    schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, actionType: { type: 'string' }, entityType: { type: 'string' }, userId: { type: 'string', nullable: true }, entityId: { type: 'string', nullable: true }, details: { type: 'string', nullable: true }, requestId: { type: 'string', nullable: true }, action: { type: 'string', nullable: true }, performedBy: { type: 'string', nullable: true }, note: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } } },
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
