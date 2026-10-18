
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  // 1. Historical approval decisions
  async getApprovalHistory(filter: ReportFilterDto) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.departmentId) {
      params.push(filter.departmentId);
      conditions.push(`r.department_id = ?`);
    }

    if (filter.startDate) {
      params.push(filter.startDate);
      conditions.push(`a.created_at >= ?`);
    }

    if (filter.endDate) {
      params.push(filter.endDate);
      conditions.push(`a.created_at < DATE_ADD(?, INTERVAL 1 DAY)`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    return this.dataSource.query(
      `SELECT a.*, r.department_id
       FROM approvals a
       JOIN resource_requests r ON r.id = a.request_id
       ${where}
       ORDER BY a.created_at DESC`,
      params,
    );
  }

  // 2. Departmental spending patterns
  async getDepartmentalSpending(filter: ReportFilterDto) {
    const conditions: string[] = [
      `r.status = 'APPROVED'`,
    ];
    const params: any[] = [];

    if (filter.departmentId) {
      params.push(filter.departmentId);
      conditions.push(`r.department_id = ?`);
    }

    if (filter.startDate) {
      params.push(filter.startDate);
      conditions.push(`r.created_at >= ?`);
    }

    if (filter.endDate) {
      params.push(filter.endDate);
      conditions.push(
        `r.created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
      );
    }

    return this.dataSource.query(
      `SELECT d.id AS departmentId,
              d.name AS departmentName,
              COALESCE(SUM(r.total_cost), 0) AS totalSpending
       FROM departments d
       LEFT JOIN resource_requests r
         ON r.department_id = d.id
         AND ${conditions.join(' AND ')}
       GROUP BY d.id, d.name
       ORDER BY totalSpending DESC`,
      params,
    );
  }

  // 3. Resource allocation history
  async getAllocationHistory(filter: ReportFilterDto) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.departmentId) {
      params.push(filter.departmentId);
      conditions.push(`r.department_id = ?`);
    }

    if (filter.startDate) {
      params.push(filter.startDate);
      conditions.push(`ra.created_at >= ?`);
    }

    if (filter.endDate) {
      params.push(filter.endDate);
      conditions.push(
        `ra.created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
      );
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    return this.dataSource.query(
      `SELECT ra.*, r.department_id
       FROM resource_allocations ra
       JOIN resource_requests r ON r.id = ra.request_id
       ${where}
       ORDER BY ra.created_at DESC`,
      params,
    );
  }

  async getDepartmentReport(
    departmentId: number,
    filter: ReportFilterDto,
  ) {
    return {
      departmentId,
      approvals: await this.getApprovalHistory({
        ...filter,
        departmentId,
      }),
      spending: await this.getDepartmentalSpending({
        ...filter,
        departmentId,
      }),
      allocations: await this.getAllocationHistory({
        ...filter,
        departmentId,
      }),
    };
  }

  // 5. Organization-wide report
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
