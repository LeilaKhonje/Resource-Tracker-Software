
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './auditlog.entity';

interface AuditLogFilters {
  userId?: string;
  actionType?: string;
  entityType?: string;
  date?: string;
  time?: string;
}

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

  async getAllLogs(
    filters: AuditLogFilters = {},
  ): Promise<AuditLog[]> {

    const query = this.auditLogRepository
      .createQueryBuilder('auditLog');

    const conditions: string[] = [];
    const parameters: Record<string, any> = {};

    // Filter by user
    if (filters.userId) {
      const userId = Number(filters.userId);

      if (!Number.isInteger(userId)) {
        throw new BadRequestException('Invalid userId');
      }

      conditions.push('auditLog.userId = :userId');
      parameters.userId = userId;
    }

    // Filter by action type
    if (filters.actionType) {
      conditions.push(
        'auditLog.actionType = :actionType',
      );
      parameters.actionType = filters.actionType;
    }

    // Filter by entity type
    if (filters.entityType) {
      conditions.push(
        'auditLog.entityType = :entityType',
      );
      parameters.entityType = filters.entityType;
    }

    // Filter by date
    if (filters.date) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(filters.date) ||
        Number.isNaN(Date.parse(filters.date))
      ) {
        throw new BadRequestException(
          'Invalid date. Use YYYY-MM-DD',
        );
      }

      conditions.push(
        'DATE(auditLog.createdAt) = :date',
      );
      parameters.date = filters.date;
    }

    // Filter by time (HH:mm)
    if (filters.time) {
      if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(filters.time)
      ) {
        throw new BadRequestException(
          'Invalid time. Use HH:mm',
        );
      }

      conditions.push(
        "DATE_FORMAT(auditLog.createdAt, '%H:%i') = :time",
      );
      parameters.time = filters.time;
    }

    // Apply OR between all supplied filters
    if (conditions.length > 0) {
      query.where(conditions[0], parameters);

      for (let i = 1; i < conditions.length; i++) {
        query.orWhere(conditions[i], parameters);
      }
    }

    return query
      .orderBy('auditLog.createdAt', 'DESC')
      .getMany();
  }

  async getLogsForRecord(
    entityType: string,
    entityId: number,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
