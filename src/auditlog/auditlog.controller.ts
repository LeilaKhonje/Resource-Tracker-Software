import {Controller,Get, Param,  ParseIntPipe, Query, UseGuards,} from '@nestjs/common';
import {AuditLogService } from './auditlog.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';


@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogService,
  ) {}

  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiResponse({ status: 200, description: 'Audit log records', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, actionType: { type: 'string' }, entityType: { type: 'string' }, details: { type: 'string', nullable: true }, requestId: { type: 'string', nullable: true }, action: { type: 'string', nullable: true }, performedBy: { type: 'string', nullable: true }, note: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } } } })
  @Get()
  getAllLogs() {
    return this.auditLogsService.getAllLogs();
  }

  @ApiOperation({ summary: 'Get audit logs for a specific record' })
  @ApiResponse({ status: 200, description: 'Matching audit log records', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, actionType: { type: 'string' }, entityType: { type: 'string' }, details: { type: 'string', nullable: true }, requestId: { type: 'string', nullable: true }, action: { type: 'string', nullable: true }, performedBy: { type: 'string', nullable: true }, note: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } } } })
  @ApiResponse({ status: 400, description: 'entityId must be an integer' })
  @Get('record/:entityType/:entityId')
  @ApiParam({ name: 'entityType', description: 'Type of the audited entity' })
  @ApiParam({ name: 'entityId', description: 'ID of the audited record', type: Number })
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
