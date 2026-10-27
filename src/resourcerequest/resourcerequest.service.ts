import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {RequestStatus, ResourceRequest} from './entities/resourcerequest.entity';
import { CreateResourceRequestDto } from './dto/create-resourcerequest.dto';
import { UpdateResourceRequestDto } from './dto/update-resourcerequest.dto';
import { AssociateTeamDto } from './dto/associate-team.dto';
import { AssociateDepartmentDto } from './dto/associate-department.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserRole } from '../users/user-role.enum';
import { AuditLog } from '../auditlog/auditlog.entity';

type AuthUser = { id: string; role: UserRole };

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
  ) {}

  // ---------------------------------------------------------------
  // 1. Create request (team lead). Always starts as DRAFT.
  // ---------------------------------------------------------------
  async create(dto: CreateResourceRequestDto, user: AuthUser) {
    if (user.role !== UserRole.TEAM_LEAD) {
      throw new ForbiddenException('Only team leads can create requests');
    }
    const request = this.requests.create({
      ...dto,
      requestedBy: user.id, // from the logged-in user, never from the body
      status: RequestStatus.DRAFT,
    });
    const saved = await this.requests.save(request);
    await this.log(saved.id, 'CREATED', user.id);
    return saved;
  }

  // Requests the current team lead has created.
  findMine(user: AuthUser) {
    return this.requests.find({
      where: { requestedBy: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    const request = await this.getOrFail(id);
    this.assertCanView(request, user);
    return request;
  }

  // Edit a request. Only the owner, and only while DRAFT or QUERIED.
  async update(id: string, dto: UpdateResourceRequestDto, user: AuthUser) {
    const request = await this.getOrFail(id);
    this.assertOwner(request, user);
    this.assertEditable(request);
    Object.assign(request, dto);
    return this.requests.save(request);
  }

  // ---------------------------------------------------------------
  // 3 & 4. Associate request with a team / department
  // ---------------------------------------------------------------
  async assignTeam(id: string, dto: AssociateTeamDto, user: AuthUser) {
    const request = await this.getOrFail(id);
    this.assertOwner(request, user);
    this.assertEditable(request);
    // TODO: ask the organization module whether this team exists and
    // whether the team lead actually belongs to it.
    request.teamId = dto.teamId;
    await this.requests.save(request);
    await this.log(id, 'TEAM_ASSIGNED', user.id, dto.teamId);
    return request;
  }

  async assignDepartment(
    id: string,
    dto: AssociateDepartmentDto,
    user: AuthUser,
  ) {
    const request = await this.getOrFail(id);
    this.assertOwner(request, user);
    this.assertEditable(request);
    // TODO: check with the organization module that this department
    // exists and that the request's team belongs to it.
    request.departmentId = dto.departmentId;
    await this.requests.save(request);
    await this.log(id, 'DEPARTMENT_ASSIGNED', user.id, dto.departmentId);
    return request;
  }

  // ---------------------------------------------------------------
  // 2. Send / submit request
  // ---------------------------------------------------------------
  async submit(id: string, user: AuthUser) {
    const request = await this.getOrFail(id);
    this.assertOwner(request, user);
    this.assertEditable(request); // DRAFT, or QUERIED (resubmitting)

    // SRS rule: a request is only valid if it comes from a team that has
    // a department, and it must be tied to a project and a line manager.
    const missing: string[] = [];
    if (!request.teamId) missing.push('team');
    if (!request.departmentId) missing.push('department');
    if (!request.projectId) missing.push('project');
    if (!request.lineManagerId) missing.push('line manager');
    if (missing.length > 0) {
      throw new BadRequestException(
        `Cannot submit: missing ${missing.join(', ')}`,
      );
    }

    request.status = RequestStatus.SUBMITTED;
    request.submittedAt = new Date();
    await this.requests.save(request);
    await this.log(id, 'SUBMITTED', user.id);

    // TODO: notification component:
    //  - notify the line manager that a request arrived
    //  - notify the team lead that the request was submitted
    return request;
  }

  // ---------------------------------------------------------------
  // 5. Request status
  // ---------------------------------------------------------------
  async getStatus(id: string, user: AuthUser) {
    const request = await this.getOrFail(id);
    this.assertCanView(request, user);
    return {
      id: request.id,
      status: request.status,
      submittedAt: request.submittedAt,
      reviewNote: request.reviewNote,
      reviewedAt: request.reviewedAt,
    };
  }

  // Line manager approves, rejects, or queries a request.
  async updateStatus(id: string, dto: UpdateStatusDto, user: AuthUser) {
    if (user.role !== UserRole.LINE_MANAGER) {
      throw new ForbiddenException(
        'Only line managers can approve, reject, or query requests',
      );
    }
    const request = await this.getOrFail(id);

    if (request.lineManagerId !== user.id) {
      throw new ForbiddenException('This request is routed to another manager');
    }
    if (request.status !== RequestStatus.SUBMITTED) {
      throw new BadRequestException(
        `Only SUBMITTED requests can be reviewed (current: ${request.status})`,
      );
    }
    if (!REVIEW_DECISIONS.includes(dto.status)) {
      throw new BadRequestException(
        'Status must be APPROVED, REJECTED, or QUERIED',
      );
    }
    if (dto.status !== RequestStatus.APPROVED && !dto.note?.trim()) {
      throw new BadRequestException(
        'A note is required when rejecting or querying a request',
      );
    }

    request.status = dto.status;
    request.reviewNote = dto.note ?? null;
    request.reviewedBy = user.id;
    request.reviewedAt = new Date();
    await this.requests.save(request);
    await this.log(id, dto.status, user.id, dto.note);

    // TODO: notification component: tell the team lead the outcome.
    return request;
  }

  // ---------------------------------------------------------------
  // 6. Tracking
  // ---------------------------------------------------------------
  // Team lead tracking: their own requests for a given team.
  // Other roles see all requests in that team.
  findByTeam(teamId: string, user: AuthUser, status?: RequestStatus) {
    const where: Record<string, any> = { teamId };
    if (user.role === UserRole.TEAM_LEAD) where.requestedBy = user.id;
    if (user.role === UserRole.LINE_MANAGER) where.lineManagerId = user.id;
    // TODO: scope DEPARTMENT_HEAD to their own department once the
    // organization module can tell us which department they head.
    if (status) where.status = status;
    return this.requests.find({ where, order: { createdAt: 'DESC' } });
  }

  // Line manager inbox: submitted requests waiting for a decision.
  async findInbox(user: AuthUser) {
    if (user.role !== UserRole.LINE_MANAGER) {
      throw new ForbiddenException('Only line managers have an inbox');
    }
    return this.requests.find({
      where: { lineManagerId: user.id, status: RequestStatus.SUBMITTED },
      order: { submittedAt: 'ASC' },
    });
  }

  // Audit trail of one request (managing director, department head, etc.)
  async getAuditTrail(id: string, user: AuthUser) {
    const request = await this.getOrFail(id);
    this.assertCanView(request, user);
    return this.audit.find({
      where: { requestId: id },
      // order: { createdAt: 'ASC' },
    });
  }

  // ---------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------
  private async getOrFail(id: string) {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    return request;
  }

  private assertOwner(request: ResourceRequest, user: AuthUser) {
    if (request.requestedBy !== user.id) {
      throw new ForbiddenException('You do not own this request');
    }
  }

  // Requests can only be changed before review, or after a query.
  private assertEditable(request: ResourceRequest) {
    const editable = [RequestStatus.DRAFT, RequestStatus.QUERIED];
    if (!editable.includes(request.status)) {
      throw new BadRequestException(
        `A ${request.status} request can no longer be changed`,
      );
    }
  }

  private assertCanView(request: ResourceRequest, user: AuthUser) {
    const isOwner = request.requestedBy === user.id;
    const isAssignedManager = request.lineManagerId === user.id;
    const isOversight =
      user.role === UserRole.DEPARTMENT_HEAD ||
      user.role === UserRole.MANAGING_DIRECTOR;
    // TODO: limit DEPARTMENT_HEAD to requests in their own department.
    if (!isOwner && !isAssignedManager && !isOversight) {
      throw new ForbiddenException('You cannot view this request');
    }
  }

  private async log(
    requestId: string,
    action: string,
    performedBy: string,
    note?: string,
  ) {
    await this.audit.save(
      this.audit.create({ requestId, action, performedBy, note }),
    );
  }
}
