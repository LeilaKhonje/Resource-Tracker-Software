
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './auditlog.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async recordAction(data: {
    userId: number;
    actionType: string;
    entityType: string;
    entityId: number;
    details?: string;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);

    return this.auditLogRepository.save(auditLog);
  }

  async getAllLogs(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getLogsForRecord(
    entityType: string,
    entityId: number,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId } as any,
      order: { createdAt: 'DESC' },
    });
  }
}
