import { BadRequestException,  ForbiddenException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {RequestStatus, ResourceRequest,} from './entities/resourcerequest.entity';
import { CreateResourceRequestDto } from './dto/create-resourcerequest.dto';
import { UpdateResourceRequestDto } from './dto/update-resourcerequest.dto';
import { QueryResourceRequestDto } from './dto/query-resourcerequest.dto';
import { AuthUser, UserRole } from './roles';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { AuditLog } from '../auditlog/auditlog.entity';
import { User } from '../users/user.entity';
import { UserRole as AccountUserRole } from '../users/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';

// The only statuses a line manager is allowed to set.
const REVIEW_DECISIONS = [
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
  RequestStatus.QUERIED,
];

@Injectable()
export class ResourcerequestService {
  constructor(
    @InjectRepository(ResourceRequest)
    private readonly requests: Repository<ResourceRequest>,
    @InjectRepository(AuditLog)
    private readonly audit: Repository<AuditLog>,
    @InjectRepository(Team)
    private readonly teams: Repository<Team>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------------------------------------------------------
  // Create (team lead). The request is sent to the line manager at once.
  // ---------------------------------------------------------------
  async create(dto: CreateResourceRequestDto, user: AuthUser) {
    if (user.role !== UserRole.TEAM_LEAD) {
      throw new ForbiddenException('Only team leads can create requests');
    }
    const references = await this.resolveOrganizationReferences(dto);
    const requester = await this.users.findOne({
      where: { id: user.id },
      select: { id: true, fullName: true },
    });
    if (!requester) {
      throw new NotFoundException(`Team Lead ${user.id} not found`);
    }

    const request = this.requests.create({
      itemDescription: dto.itemDescription,
      batchNumber: dto.batchNumber,
      quantity: dto.quantity,
      expectedDurationDays: dto.expectedDurationDays,
      teamId: String(references.team.id),
      departmentId: String(references.team.department!.id),
      projectId: String(references.project.id),
      lineManagerId: references.lineManager.id,
      requestedBy: user.id, // from the logged-in user, never from the body
      status: RequestStatus.SUBMITTED,
      submittedAt: new Date(),
    });
    const saved = await this.requests.save(request);
    await this.log(saved.id, 'SUBMITTED', user.id);
    await this.notifications.createNotification(
      references.lineManager.id,
      `Team Lead ${requester.fullName} from team ${references.team.name}, working on project ${references.project.name}, requests ${dto.quantity} x ${dto.itemDescription} for ${dto.expectedDurationDays} day(s).`,
    );
    return saved;
  }

  // ---------------------------------------------------------------
  // Read: one list endpoint, results depend on who is asking
  //   team lead:    the requests they created
  //   line manager: the requests routed to them
  //   dept head / managing director: everything
  // ---------------------------------------------------------------
  async findAll(query: QueryResourceRequestDto, user: AuthUser) {
    const where: FindOptionsWhere<ResourceRequest> = {};
    if (query.status) where.status = query.status;
    if (query.teamId) where.teamId = query.teamId;

    if (user.role === UserRole.TEAM_LEAD) {
      where.requestedBy = user.id;
    } else if (user.role === UserRole.LINE_MANAGER) {
      where.lineManagerId = user.id;
    } else if (user.role === UserRole.DEPARTMENT_HEAD) {
      const departmentId = await this.getDepartmentHeadDepartmentId(user.id);
      where.departmentId = String(departmentId);
    }

    return this.requests.find({ where, order: { createdAt: 'DESC' } });
  }

  // One request. With includeAudit, the audit trail is attached too.
  async findOne(id: string, user: AuthUser, includeAudit = false) {
    const request = await this.getOrFail(id);
    await this.assertCanView(request, user);
    if (!includeAudit) return request;

    const auditTrail = await this.audit.find({
      where: { requestId: id },
      order: { createdAt: 'ASC' },
    });
    return { ...request, auditTrail };
  }

  // ---------------------------------------------------------------
  // Write: one update endpoint
  //   team lead: edit a QUERIED request and resubmit it (status SUBMITTED)
  //   line manager: status APPROVED / REJECTED / QUERIED (with note)
  // ---------------------------------------------------------------
  async update(id: string, dto: UpdateResourceRequestDto, user: AuthUser) {
    const request = await this.getOrFail(id);
    const {
      status,
      note,
      teamName,
      projectName,
      lineManagerName,
      ...fields
    } = dto;
    const referenceChanges = Object.fromEntries(
      Object.entries({ teamName, projectName, lineManagerName }).filter(
        ([, value]) => value !== undefined,
      ),
    );

    // Keep only the fields that were actually sent.
    const changes: Record<string, unknown> = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    const changedKeys = Object.keys(changes);

    if (
      status === undefined &&
      changedKeys.length === 0 &&
      Object.keys(referenceChanges).length === 0
    ) {
      throw new BadRequestException('Nothing to update');
    }

    // A review decision (line manager). It can't be mixed with edits.
    if (status !== undefined && status !== RequestStatus.SUBMITTED) {
      if (changedKeys.length > 0 || Object.keys(referenceChanges).length > 0) {
        throw new BadRequestException(
          'A review decision cannot be combined with edits',
        );
      }
      return this.review(request, status, note, user);
    }

    // Everything below is the team lead's: editing and resubmitting.
    this.assertOwner(request, user);
    this.assertEditable(request);
    const previousTeamId = request.teamId;
    const previousDepartmentId = request.departmentId;
    Object.assign(request, changes);

    if (Object.keys(referenceChanges).length > 0 || status === RequestStatus.SUBMITTED) {
      const references = await this.resolveOrganizationReferences({
        teamName,
        projectName,
        lineManagerName,
        teamId: request.teamId,
        projectId: request.projectId,
        lineManagerId: request.lineManagerId,
      });
      request.teamId = String(references.team.id);
      request.departmentId = String(references.team.department!.id);
      request.projectId = String(references.project.id);
      request.lineManagerId = references.lineManager.id;
    }

    const submitting = status === RequestStatus.SUBMITTED;
    if (submitting) {
      // SRS rule: a request is only valid if it comes from a team that has
      // a department, and it must be tied to a project and a line manager.
      const missing: string[] = [];
      if (!request.teamId) missing.push('team');
      if (!request.departmentId) missing.push('department');
      if (!request.projectId) missing.push('project');
      if (!request.lineManagerId) missing.push('line manager');
      if (!request.expectedDurationDays) missing.push('expectedDurationDays');
      if (missing.length > 0) {
        throw new BadRequestException(
          `Cannot resubmit: missing ${missing.join(', ')}`,
        );
      }
      request.status = RequestStatus.SUBMITTED;
      request.submittedAt = new Date();
    }

    const saved = await this.requests.save(request);

    // One audit entry per kind of change.
    if (teamName !== undefined && request.teamId !== previousTeamId) {
      await this.log(id, 'TEAM_CHANGED', user.id, request.teamId);
    }
    if (request.departmentId !== previousDepartmentId) {
      await this.log(id, 'DEPARTMENT_CHANGED', user.id, request.departmentId);
    }
    if (
      changedKeys.length > 0 ||
      projectName !== undefined ||
      lineManagerName !== undefined ||
      (teamName !== undefined && request.teamId === previousTeamId)
    ) {
      await this.log(id, 'UPDATED', user.id);
    }
    if (submitting) {
      await this.log(id, 'RESUBMITTED', user.id);
      // TODO: notification component: tell the line manager it is back.
    }
    return saved;
  }

  // Line manager approves, rejects, or queries a SUBMITTED request.
  private async review(
    request: ResourceRequest,
    status: RequestStatus,
    note: string | undefined,
    user: AuthUser,
  ) {
    if (user.role !== UserRole.LINE_MANAGER) {
      throw new ForbiddenException(
        'Only line managers can approve, reject, or query requests',
      );
    }
    if (request.lineManagerId !== user.id) {
      throw new ForbiddenException('This request is routed to another manager');
    }
    if (request.status !== RequestStatus.SUBMITTED) {
      throw new BadRequestException(
        `Only SUBMITTED requests can be reviewed (current: ${request.status})`,
      );
    }
    if (!REVIEW_DECISIONS.includes(status)) {
      throw new BadRequestException(
        'Status must be SUBMITTED (team lead) or APPROVED, REJECTED, QUERIED (line manager)',
      );
    }
    if (status !== RequestStatus.APPROVED && !note?.trim()) {
      throw new BadRequestException(
        'A note is required when rejecting or querying a request',
      );
    }

    request.status = status;
    request.reviewNote = note ?? null;
    request.reviewedBy = user.id;
    request.reviewedAt = new Date();
    const saved = await this.requests.save(request);
    await this.log(request.id, status, user.id, note);

    // TODO: notification component: tell the team lead the outcome.
    return saved;
  }

  // ---------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------
  private async getOrFail(id: string) {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    return request;
  }

  private async resolveOrganizationReferences(reference: {
    teamName?: string;
    projectName?: string;
    lineManagerName?: string;
    teamId?: string;
    projectId?: string;
    lineManagerId?: string;
  }): Promise<{ team: Team; project: Project; lineManager: User }> {
    let team: Team | null;
    if (reference.teamName !== undefined) {
      const matches = await this.teams.find({
        where: { name: reference.teamName.trim() },
        relations: { department: true },
      });
      if (matches.length === 0) {
        throw new NotFoundException(`Team '${reference.teamName}' not found`);
      }
      if (matches.length > 1) {
        throw new BadRequestException(
          `Team name '${reference.teamName}' is ambiguous; team names must be unique to use name-based requests`,
        );
      }
      team = matches[0];
    } else if (reference.teamId) {
      const teamId = this.parseOrganizationId(reference.teamId, 'teamId');
      team = await this.teams.findOne({
        where: { id: teamId },
        relations: { department: true },
      });
    } else {
      throw new BadRequestException('A team name is required');
    }
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    if (!team.department) {
      throw new BadRequestException(`Team '${team.name}' has no department`);
    }

    let project: Project | null;
    if (reference.projectName !== undefined) {
      const matches = await this.projects.find({
        where: { name: reference.projectName.trim(), teams: { id: team.id } },
        relations: { teams: true },
      });
      if (matches.length === 0) {
        throw new NotFoundException(
          `Project '${reference.projectName}' not found for team '${team.name}'`,
        );
      }
      if (matches.length > 1) {
        throw new BadRequestException(
          `Project name '${reference.projectName}' is ambiguous for team '${team.name}'`,
        );
      }
      project = matches[0];
    } else if (reference.projectId) {
      const projectId = this.parseOrganizationId(reference.projectId, 'projectId');
      project = await this.projects.findOne({
        where: { id: projectId },
        relations: { teams: true },
      });
    } else {
      throw new BadRequestException('A project name is required');
    }
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (!project.teams?.some((projectTeam) => projectTeam.id === team!.id)) {
      throw new BadRequestException(
        `Project '${project.name}' is not assigned to team '${team.name}'`,
      );
    }

    let lineManager: User;
    if (reference.lineManagerName !== undefined) {
      const matches = await this.users.find({
        where: {
          fullName: reference.lineManagerName.trim(),
          role: AccountUserRole.LINE_MANAGER,
          isActive: true,
        },
        select: { id: true, fullName: true, role: true, isActive: true },
      });
      if (matches.length === 0) {
        throw new NotFoundException(
          `Active Line Manager '${reference.lineManagerName}' not found`,
        );
      }
      if (matches.length > 1) {
        throw new BadRequestException(
          `Line Manager name '${reference.lineManagerName}' is ambiguous; use a unique full name`,
        );
      }
      lineManager = matches[0];
    } else if (reference.lineManagerId) {
      lineManager = await this.assertLineManager(reference.lineManagerId);
    } else {
      throw new BadRequestException('A line manager name is required');
    }

    return { team, project, lineManager };
  }

  private async assertLineManager(lineManagerId: string): Promise<User> {
    const manager = await this.users.findOne({
      where: { id: lineManagerId },
      select: { id: true, role: true, isActive: true },
    });

    if (!manager) {
      throw new NotFoundException(`Line manager ${lineManagerId} not found`);
    }
    if (!manager.isActive || manager.role !== AccountUserRole.LINE_MANAGER) {
      throw new BadRequestException(
        'lineManagerId must refer to an active user with the Line Manager role',
      );
    }
    return manager;
  }

  private parseOrganizationId(
    value: string | undefined,
    field: string,
  ): number {
    if (!value || !/^\d+$/.test(value)) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return id;
  }

  private assertOwner(request: ResourceRequest, user: AuthUser) {
    if (request.requestedBy !== user.id) {
      throw new ForbiddenException('You do not own this request');
    }
  }

  // A request can only be edited after the line manager has queried it.
  private assertEditable(request: ResourceRequest) {
    if (request.status !== RequestStatus.QUERIED) {
      throw new BadRequestException(
        `A ${request.status} request cannot be edited. A request can only be edited after the line manager queries it.`,
      );
    }
  }

  private async assertCanView(request: ResourceRequest, user: AuthUser) {
    if (user.role === UserRole.DEPARTMENT_HEAD) {
      const departmentId = await this.getDepartmentHeadDepartmentId(user.id);
      if (request.departmentId !== String(departmentId)) {
        throw new ForbiddenException('You can only view requests from your department');
      }
      return;
    }

    const isOwner = request.requestedBy === user.id;
    const isAssignedManager = request.lineManagerId === user.id;
    const isOversight = user.role === UserRole.MANAGING_DIRECTOR;
    if (!isOwner && !isAssignedManager && !isOversight) {
      throw new ForbiddenException('You cannot view this request');
    }
  }

  private async getDepartmentHeadDepartmentId(userId: string): Promise<number> {
    const departmentHead = await this.users.findOne({
      where: { id: userId },
      relations: { department: true },
    });
    if (!departmentHead) {
      throw new NotFoundException('Department Head account not found');
    }
    if (!departmentHead.department) {
      throw new ForbiddenException('Your account is not assigned to a department');
    }
    return departmentHead.department.id;
  }

    private async log(
    requestId: string,
    action: string,
    performedBy: string,
    note?: string,
  ) {
    await this.audit.save(
      this.audit.create({
        actionType: action, // required by the group's audit table
        entityType: 'RESOURCE_REQUEST', // required by the group's audit table
        requestId,
        action,
        performedBy,
        note: note ?? null,
        details: note ?? null,
      }),
    );
  }
}
