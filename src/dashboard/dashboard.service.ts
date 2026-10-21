
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  // Summary cards
  async getSummary(departmentId?: number) {
    const params: any[] = [];
    let departmentCondition = '';

    if (departmentId !== undefined) {
      departmentCondition = 'WHERE department_id = ?';
      params.push(departmentId);
    }

    const [result] = await this.dataSource.query(
      `SELECT
         COUNT(*) AS totalRequests,
         COALESCE(SUM(status = 'PENDING'), 0) AS pendingApprovals,
         COALESCE(SUM(status = 'APPROVED'), 0) AS approvedRequests,
         COALESCE(SUM(status = 'REJECTED'), 0) AS rejectedRequests
       FROM resource_requests
       ${departmentCondition}`,
      params,
    );

    const allocationParams: any[] = [];
    let allocationCondition = '';

    if (departmentId !== undefined) {
      allocationCondition = 'WHERE department_id = ?';
      allocationParams.push(departmentId);
    }

    const [allocationResult] = await this.dataSource.query(
      `SELECT COUNT(*) AS allocatedResources
       FROM resource_allocations
       ${allocationCondition}`,
      allocationParams,
    );

    return {
      totalRequests: Number(result.totalRequests),
      pendingApprovals: Number(result.pendingApprovals),
      approvedRequests: Number(result.approvedRequests),
      rejectedRequests: Number(result.rejectedRequests),
      allocatedResources: Number(
        allocationResult.allocatedResources,
      ),
    };
  }

  // Recent audit activity
  async getRecentActivity(limit = 10) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    return this.dataSource.query(
      `SELECT *
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`,
    );
  }

  // Spending summary grouped by department
  async getDepartmentSpending() {
    return this.dataSource.query(
      `SELECT
         d.id AS departmentId,
         d.name AS departmentName,
         COALESCE(SUM(
           CASE
             WHEN r.status = 'APPROVED' THEN r.total_cost
             ELSE 0
           END
         ), 0) AS totalSpending
       FROM departments d
       LEFT JOIN resource_requests r
         ON r.department_id = d.id
       GROUP BY d.id, d.name
       ORDER BY totalSpending DESC`,
    );
  }

  // Complete dashboard data
  async getDashboard(departmentId?: number) {
    return {
      summary: await this.getSummary(departmentId),
      recentActivity: await this.getRecentActivity(),
      departmentSpending: await this.getDepartmentSpending(),
    };
  }
}
