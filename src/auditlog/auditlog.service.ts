
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';

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

  // Record an action performed in the system
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

  // GET 1: Retrieve ALL audit logs
  async getAllLogs(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // GET 2: Filter audit logs using OR logic
  async filterLogs(
    filters: AuditLogFilters,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('auditLog');

    const conditions: {
      condition: string;
      parameters: Record<string, any>;
    }[] = [];

    // Filter by user ID
    if (filters.userId?.trim()) {
      const userId = Number(filters.userId);

      if (!Number.isInteger(userId) || userId <= 0) {
        throw new BadRequestException('Invalid userId');
      }

      conditions.push({
        condition: 'auditLog.userId = :userId',
        parameters: { userId },
      });
    }

    // Filter by action type
    if (filters.actionType?.trim()) {
      conditions.push({
        condition: 'auditLog.actionType = :actionType',
        parameters: {
          actionType: filters.actionType.trim(),
        },
      });
    }

    // Filter by entity type
    if (filters.entityType?.trim()) {
      conditions.push({
        condition: 'auditLog.entityType = :entityType',
        parameters: {
          entityType: filters.entityType.trim(),
        },
      });
    }

    const date = filters.date?.trim();
    const time = filters.time?.trim();

    // Validate date
    if (date) {
      const parsedDate = new Date(`${date}T00:00:00.000Z`);

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        throw new BadRequestException(
          'Invalid date. Use YYYY-MM-DD',
        );
      }
    }

    // Validate time
    if (time) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new BadRequestException(
          'Invalid time. Use HH:mm',
        );
      }
    }

    // Date and time together count as ONE criterion
    if (date && time) {
      conditions.push({
        condition:
          "DATE_FORMAT(auditLog.createdAt, '%Y-%m-%d %H:%i') = :dateTime",
        parameters: {
          dateTime: `${date} ${time}`,
        },
      });
    } else if (date) {
      conditions.push({
        condition: 'DATE(auditLog.createdAt) = :date',
        parameters: { date },
      });
    } else if (time) {
      conditions.push({
        condition:
          "DATE_FORMAT(auditLog.createdAt, '%H:%i') = :time",
        parameters: { time },
      });
    }

    // No filters: return all audit logs
    if (conditions.length === 0) {
      return this.getAllLogs();
    }

    // Apply OR logic between supplied criteria
    query.where(
      new Brackets((qb) => {
        conditions.forEach((item, index) => {
          if (index === 0) {
            qb.where(item.condition, item.parameters);
          } else {
            qb.orWhere(item.condition, item.parameters);
          }
        });
      }),
    );

    return query
      .orderBy('auditLog.createdAt', 'DESC')
      .getMany();
  }
}
