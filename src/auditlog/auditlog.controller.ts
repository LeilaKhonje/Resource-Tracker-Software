
import {Controller,Get, Param,  ParseIntPipe, Query, UseGuards,} from '@nestjs/common';
import {AuditLogService } from './auditlog.service';


@Controller('audit-logs')
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogService,
  ) {}

  @Get()
  getAllLogs() {
    return this.auditLogsService.getAllLogs();
  }

  @Get('record/:entityType/:entityId')
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
