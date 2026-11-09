
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './auditlog.entity';
import { AuditLogsController } from './auditlog.controller';
import {  AuditLogService } from './auditlog.service';
import { AuthSecurityModule } from '../auth/auth-security.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), AuthSecurityModule],
  controllers: [AuditLogsController],
  providers: [ AuditLogService],
  exports: [ AuditLogService],
})
export class AuditLogModule {}
