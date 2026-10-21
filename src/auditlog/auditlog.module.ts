
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './auditlog.entity';
import { AuditLogsController } from './auditlog.controller';
import {  AuditLogService } from './auditlog.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [ AuditLogService],
  exports: [ AuditLogService],
})
export class AuditLogsModule {}
