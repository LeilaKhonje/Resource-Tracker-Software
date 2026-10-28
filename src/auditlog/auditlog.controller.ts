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
  @ApiResponse({ status: 200, description: 'Return all audit logs' })
  @Get()
  getAllLogs() {
    return this.auditLogsService.getAllLogs();
  }

  @ApiOperation({ summary: 'Get audit logs for a specific record' })
  @ApiResponse({ status: 200, description: 'Return audit logs for the specified record' })
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
