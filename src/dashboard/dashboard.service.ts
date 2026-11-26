
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { DepartmentsService } from '../departments/departments.service';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { AuthTokenPayload } from '../auth/interfaces/auth-token-payload.interface';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentsService: DepartmentsService,
  ) {}

  // Get all departments through DepartmentsModule
  async getDepartments() {
    return this.departmentsService.findAll();
  }

  // Summary cards
  async getSummary(departmentId?: number) {
    const params: any[] = [];
    let departmentCondition = '';

    if (departmentId !== undefined) {
      departmentCondition = 'WHERE departmentId = ?';
      params.push(departmentId);
    }

    const [result] = await this.dataSource.query(
      `SELECT
         COUNT(*) AS totalRequests,
         COALESCE(SUM(status IN ('SUBMITTED', 'QUERIED')), 0) AS pendingApprovals,
         COALESCE(SUM(status = 'APPROVED'), 0) AS approvedRequests,
         COALESCE(SUM(status = 'REJECTED'), 0) AS rejectedRequests
       FROM resource_request
       ${departmentCondition}`,
      params,
    );

    return {
      totalRequests: Number(result.totalRequests),
      pendingApprovals: Number(result.pendingApprovals),
      approvedRequests: Number(result.approvedRequests),
      rejectedRequests: Number(result.rejectedRequests),
    };
  }

  // Recent audit activity
  async getRecentActivity(limit = 10) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    return this.dataSource.query(
      `SELECT *
       FROM audit_logs
       ORDER BY createdAt DESC
       LIMIT ${safeLimit}`,
    );
  }

  // Spending summary grouped by department
  async getDepartmentSpending() {
    return this.dataSource.query(
      `SELECT
         d.id AS departmentId,
         d.name AS departmentName,
         COALESCE(
           SUM(
             CASE
               WHEN r.status = 'APPROVED'
               THEN r.price * r.quantity
               ELSE 0
             END
           ), 0
         ) AS totalSpending
       FROM department d
       LEFT JOIN resource_request r
         ON r.departmentId = d.id
       GROUP BY d.id, d.name
       ORDER BY totalSpending DESC`,
    );
  }

  // Get dashboard details for a particular department
  async getDepartmentDashboard(departmentId: number) {
    const departments = await this.departmentsService.findAll();

    const department = departments.find(
      (item: any) => Number(item.id) === departmentId,
    );

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    return {
      department,
      summary: await this.getSummary(departmentId),
    };
  }

  // Complete dashboard data
  async getDashboard(user: AuthTokenPayload, departmentId?: number) {
    if (user.role === UserRole.LINE_MANAGER) {
      return {
        requests: await this.dataSource.getRepository(ResourceRequest).find({
          where: { lineManagerId: user.sub },
          order: { createdAt: 'DESC' },
        }),
      };
    }

    if (user.role === UserRole.DEPARTMENT_HEAD) {
      const departmentHead = await this.dataSource.getRepository(User).findOne({
        where: { id: user.sub },
        select: { id: true, department: { id: true } },
        relations: { department: true },
      });
      if (!departmentHead?.department) {
        throw new ForbiddenException('Department Head is not assigned to a department');
      }

      return {
        requests: await this.dataSource.getRepository(ResourceRequest).find({
          where: { departmentId: String(departmentHead.department.id) },
          order: { createdAt: 'DESC' },
        }),
      };
    }

    return {
      summary: await this.getSummary(departmentId),
      recentActivity: await this.getRecentActivity(),
      departmentSpending: await this.getDepartmentSpending(),
      departments: await this.getDepartments(),
    };
  }
}
