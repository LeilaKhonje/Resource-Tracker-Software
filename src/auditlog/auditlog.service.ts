
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';

import { AuditLog } from './auditlog.entity';

export interface AuditLogFilters {
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

  async getLogs(filters: AuditLogFilters) {

    const query = this.auditLogRepository
      .createQueryBuilder('log');

    const conditions: string[] = [];
    const parameters: Record<string, any> = {};

    // Filter by user ID
    if (filters.userId) {
      const userId = Number(filters.userId);

      if (!Number.isInteger(userId) || userId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }

      conditions.push('log.userId = :userId');
      parameters.userId = userId;
    }

    // Filter by action type
    if (filters.actionType) {
      conditions.push('log.actionType = :actionType');
      parameters.actionType = filters.actionType;
    }

    // Filter by entity type
    if (filters.entityType) {
      conditions.push('log.entityType = :entityType');
      parameters.entityType = filters.entityType;
    }

    // Filter by date
    if (filters.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
        throw new BadRequestException(
          'Date must be in YYYY-MM-DD format',
        );
      }

      conditions.push(
        'DATE(log.createdAt) = :date',
      );

      parameters.date = filters.date;
    }

    // Filter by time
    if (filters.time) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(filters.time)) {
        throw new BadRequestException(
          'Time must be in HH:mm format',
        );
      }

      conditions.push(
        'TIME(log.createdAt) = :time',
      );

      parameters.time = filters.time;
    }

    // Apply OR filtering only when filters are provided
    if (conditions.length > 0) {
      query.where(
        new Brackets((qb) => {
          conditions.forEach((condition, index) => {
            if (index === 0) {
              qb.where(condition);
            } else {
              qb.orWhere(condition);
            }
          });
        }),
      );

      query.setParameters(parameters);
    }

    // If no filters are provided, retrieve ALL logs
    return await query
      .orderBy('log.createdAt', 'DESC')
      .getMany();
  }
}
