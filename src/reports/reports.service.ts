
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getApprovalHistory(filter: ReportFilterDto) {
    const conditions: string[] = [
      `r.status IN ('APPROVED', 'REJECTED')`,
    ];
    const params: any[] = [];

    if (filter.departmentId) {
      params.push(filter.departmentId);
      conditions.push(`r.departmentId = ?`);
    }

    if (filter.startDate) {
      params.push(filter.startDate);
      conditions.push(`r.createdAt >= ?`);
    }

    if (filter.endDate) {
      params.push(filter.endDate);
      conditions.push(`r.createdAt < DATE_ADD(?, INTERVAL 1 DAY)`);
    }

    return this.dataSource.query(
      `SELECT
          r.id AS requestId,
          r.itemDescription,
          r.departmentId,
          r.status,
          r.createdAt
       FROM resource_requests r
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.createdAt DESC`,
      params,
    );
  }

  async getDepartmentalSpending(filter: ReportFilterDto) {
    const conditions: string[] = [
      `r.status = 'APPROVED'`,
    ];
    const params: any[] = [];

    if (filter.departmentId) {
      params.push(filter.departmentId);
      conditions.push(`r.departmentId = ?`);
    }

    if (filter.startDate) {
      params.push(filter.startDate);
      conditions.push(`r.createdAt >= ?`);
    }

    if (filter.endDate) {
      params.push(filter.endDate);
      conditions.push(`r.createdAt < DATE_ADD(?, INTERVAL 1 DAY)`);
    }

    return this.dataSource.query(
      `SELECT
          d.id AS departmentId,
          d.name AS departmentName,
          COALESCE(
            SUM(r.unitPrice * r.quantity),
            0
          ) AS totalSpending
       FROM department d
       LEFT JOIN resource_requests r
         ON r.departmentId = d.id
         AND ${conditions.join(' AND ')}
       GROUP BY d.id, d.name
       ORDER BY totalSpending DESC`,
      params,
    );
  }

  async getAllocationHistory(filter: ReportFilterDto) {
    return [];
  }

  async getDepartmentReport(
    departmentId: number,
    filter: ReportFilterDto,
  ) {
    const departmentFilter = {
      ...filter,
      departmentId,
    };

    return {
      departmentId,
      approvals: await this.getApprovalHistory(departmentFilter),
      spending: await this.getDepartmentalSpending(departmentFilter),
      allocations: await this.getAllocationHistory(departmentFilter),
    };
  }

  async getOrganizationReport(filter: ReportFilterDto) {
    const organizationFilter = {
      startDate: filter.startDate,
      endDate: filter.endDate,
    };

    return {
      approvals: await this.getApprovalHistory(organizationFilter),
      spending: await this.getDepartmentalSpending(organizationFilter),
      allocations: await this.getAllocationHistory(organizationFilter),
    };
  }
}
