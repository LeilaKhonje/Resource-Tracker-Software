import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import {
  RequestStatus,
  ResourceRequest,
} from './entities/resourcerequest.entity';
import { RequestAuditLog } from './entities/request-audit-log.entity';
import { CreateResourceRequestDto } from './dto/create-resourcerequest.dto';
import { UpdateResourceRequestDto } from './dto/update-resourcerequest.dto';
import { QueryResourceRequestDto } from './dto/query-resourcerequest.dto';
import { AuthUser, UserRole } from './roles';

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
       @InjectRepository(RequestAuditLog)
    private readonly audit: Repository<RequestAuditLog>,
  ) {}

  // ---------------------------------------------------------------
  // Create (team lead). Always starts as DRAFT.
  // ---------------------------------------------------------------
  async create(dto: CreateResourceRequestDto, user: AuthUser) {
    if (user.role !== UserRole.TEAM_LEAD) {
      throw new ForbiddenException('Only team leads can create requests');
    }
    // TODO: check teamId, departmentId and projectId against the
    // organization module (they exist, and the team belongs to the department).
    const request = this.requests.create({
      ...dto,
      requestedBy: user.id, // from the logged-in user, never from the body
      status: RequestStatus.DRAFT,
    });
    const saved = await this.requests.save(request);
    await this.log(saved.id, 'CREATED', user.id);
    return saved;
  }

  // ---------------------------------------------------------------
  // Read: one list endpoint, results depend on who is asking
  //   team lead:    the requests they created
  //   line manager: submitted requests routed to them (drafts hidden)
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
      if (query.status === RequestStatus.DRAFT) return [];
      if (!query.status) where.status = Not(RequestStatus.DRAFT);
    }
    // TODO: scope DEPARTMENT_HEAD to their own department once the
    // organization module can tell us which department they head.

    return this.requests.find({ where, order: { createdAt: 'DESC' } });
  }

  // One request. With includeAudit, the audit trail is attached too.
  async findOne(id: string, user: AuthUser, includeAudit = false) {
    const request = await this.getOrFail(id);
    this.assertCanView(request, user);
    if (!includeAudit) return request;

    const auditTrail = await this.audit.find({
      where: { requestId: id },
      order: { createdAt: 'ASC' },
    });
    return { ...request, auditTrail };
  }

  // ---------------------------------------------------------------
  // Write: one update endpoint
  //   team lead: edit details, change team/department, status SUBMITTED
  //   line manager: status APPROVED / REJECTED / QUERIED (with note)
  // ---------------------------------------------------------------
  async update(id: string, dto: UpdateResourceRequestDto, user: AuthUser) {
    const request = await this.getOrFail(id);
    const { status, note, ...fields } = dto;

    // Keep only the fields that were actually sent.
    const changes: Record<string, unknown> = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    const changedKeys = Object.keys(changes);

    if (status === undefined && changedKeys.length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    // A review decision (line manager). It can't be mixed with edits.
    if (status !== undefined && status !== RequestStatus.SUBMITTED) {
      if (changedKeys.length > 0) {
        throw new BadRequestException(
          'A review decision cannot be combined with edits',
        );
      }
      return this.review(request, status, note, user);
    }

    // Everything below is the team lead's: edits and submitting.
    this.assertOwner(request, user);
    this.assertEditable(request);
    // TODO: when teamId or departmentId change, check them against the
    // organization module (team exists, belongs to the department).
    Object.assign(request, changes);

    const submitting = status === RequestStatus.SUBMITTED;
    if (submitting) {
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
    }

    const saved = await this.requests.save(request);

    // One audit entry per kind of change.
    if (changedKeys.includes('teamId')) {
      await this.log(id, 'TEAM_CHANGED', user.id, request.teamId);
    }
    if (changedKeys.includes('departmentId')) {
      await this.log(id, 'DEPARTMENT_CHANGED', user.id, request.departmentId);
    }
    if (changedKeys.some((key) => key !== 'teamId' && key !== 'departmentId')) {
      await this.log(id, 'UPDATED', user.id);
    }
    if (submitting) {
      await this.log(id, 'SUBMITTED', user.id);
      // TODO: notification component:
      //  - notify the line manager that a request arrived
      //  - notify the team lead that the request was submitted
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
