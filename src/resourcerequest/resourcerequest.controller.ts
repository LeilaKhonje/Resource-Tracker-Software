import {Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResourcerequestService } from './resourcerequest.service';
import { CreateResourceRequestDto } from './dto/create-resourcerequest.dto';
import { UpdateResourceRequestDto } from './dto/update-resourcerequest.dto';
import { QueryResourceRequestDto } from './dto/query-resourcerequest.dto';
import { AuthUser, UserRole } from './roles';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole as AuthRole } from '../users/user-role.enum';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiStandardErrorResponses } from '../common/swagger-response.decorators';

const resourceRequestResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    itemName: { type: 'string', nullable: true },
    resourceId: { type: 'string', format: 'uuid', nullable: true },
    itemDescription: { type: 'string' },
    manufacturerLabel: { type: 'string', nullable: true },
    price: { type: 'number', nullable: true },
    batchNumber: { type: 'string' },
    vendor: { type: 'string', nullable: true },
    quantity: { type: 'integer' },
    expectedDurationDays: { type: 'integer', nullable: true },
    status: { type: 'string', enum: ['SUBMITTED', 'QUERIED', 'APPROVED', 'REJECTED'] },
    requestedBy: { type: 'string', format: 'uuid' },
    lineManagerId: { type: 'string', format: 'uuid' },
    projectId: { type: 'string' },
    teamId: { type: 'string', nullable: true },
    departmentId: { type: 'string', nullable: true },
    reviewNote: { type: 'string', nullable: true },
    reviewedBy: { type: 'string', nullable: true },
    reviewedAt: { type: 'string', format: 'date-time', nullable: true },
    submittedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};



@ApiTags('resource-requests')
@ApiStandardErrorResponses(400, 401, 403, 500)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1')
export class ResourcerequestController {
  constructor(private readonly service: ResourcerequestService) {}

  private currentUser(req: AuthenticatedRequest): AuthUser {
    const roleMap: Partial<Record<AuthRole, UserRole>> = {
      [AuthRole.TEAM_LEAD]: UserRole.TEAM_LEAD,
      [AuthRole.LINE_MANAGER]: UserRole.LINE_MANAGER,
      [AuthRole.DEPARTMENT_HEAD]: UserRole.DEPARTMENT_HEAD,
      [AuthRole.MANAGING_DIRECTOR]: UserRole.MANAGING_DIRECTOR,
    };
    const role = req.user?.role && roleMap[req.user.role];
    if (!role) {
      throw new ForbiddenException('This role cannot access resource requests');
    }
    return { id: req.user!.sub, role };
  }
  
  @Post('api/v1/resource-request')
  @ApiBearerAuth('access-token')
  @Roles(AuthRole.TEAM_LEAD)
  @ApiOperation({ summary: 'Submit a resource request', description: 'The Team Lead supplies a resourceId, request details, projectId, teamId, and lineManagerName. The resource ID is resolved against the catalog; the server derives the department from the team and sets requestedBy from the caller.' })
  @ApiBody({ type: CreateResourceRequestDto, examples: { laptopRequest: { summary: 'Request laptops', value: { resourceId: '550e8400-e29b-41d4-a716-446655440000', itemDescription: 'Laptop for field data collection', batchNumber: 'LOT-2026-04', quantity: 3, expectedDurationDays: 14, projectId: 12, lineManagerName: 'Jordan Lee', teamId: 4 } } } })
  @ApiResponse({ status: 201, description: 'Request submitted with status SUBMITTED and notification created for the designated Line Manager.', schema: resourceRequestResponseSchema })
  @ApiBadRequestResponse({ description: 'Invalid fields or IDs, or the project is not assigned to the team.' })
  @ApiNotFoundResponse({ description: 'Team, project, active Line Manager, or requesting Team Lead not found.' })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  @ApiForbiddenResponse({ description: 'Only Team Leads can create requests, and only for their assigned team.' })
  create(@Body() dto: CreateResourceRequestDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, this.currentUser(req));
  }

 
  @Get('api/v1/resource-request')
  @ApiBearerAuth('access-token')
  @Roles(AuthRole.TEAM_LEAD, AuthRole.LINE_MANAGER, AuthRole.DEPARTMENT_HEAD, AuthRole.MANAGING_DIRECTOR)
  @ApiOperation({ summary: 'List requests visible to the caller', description: 'Team leads see their own requests; line managers see requests routed to them; department heads see requests from their assigned department; managing directors see all requests.' })
  @ApiQuery({ name: 'status', required: false, enum: ['SUBMITTED', 'QUERIED', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'teamId', required: false, type: String, description: 'Filter by numeric team ID.' })
  @ApiResponse({ status: 200, description: 'Requests ordered newest first.', schema: { type: 'array', items: resourceRequestResponseSchema } })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  findAll(@Query() query: QueryResourceRequestDto, @Req() req: AuthenticatedRequest) {
    return this.service.findAll(query, this.currentUser(req));
  }

  
  @ApiQuery({ name: 'include', required: false, enum: ['audit'] })
  @Get('api/v1/resource-request/:id')
  @ApiBearerAuth('access-token')
  @Roles(AuthRole.TEAM_LEAD, AuthRole.LINE_MANAGER, AuthRole.DEPARTMENT_HEAD, AuthRole.MANAGING_DIRECTOR)
  @ApiOperation({ summary: 'Get a resource request', description: 'Pass include=audit to attach the request audit trail in chronological order.' })
  @ApiResponse({ status: 200, description: 'Request details; includes auditTrail when requested.', schema: { allOf: [resourceRequestResponseSchema], properties: { auditTrail: { type: 'array', items: { type: 'object', additionalProperties: true } } } } })
  @ApiBadRequestResponse({ description: 'Request ID is not a UUID.' })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  @ApiForbiddenResponse({ description: 'Caller is not the requester, assigned line manager, department head, or managing director.' })
  @ApiNotFoundResponse({ description: 'Request does not exist.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('include') include: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findOne(id, this.currentUser(req), include === 'audit');
  }

  
  @Patch('api/v1/resource-request/:id')
  @ApiBearerAuth('access-token')
  @Roles(AuthRole.TEAM_LEAD, AuthRole.LINE_MANAGER)
  @ApiOperation({ summary: 'Edit, submit, or review a resource request', description: 'The owning Team Lead may edit a QUERIED request, including changing the selected catalog resource, and resubmit it with status SUBMITTED. The assigned Line Manager may review a SUBMITTED request with APPROVED, REJECTED, or QUERIED. Rejection and query require a note.' })
  @ApiBody({ type: UpdateResourceRequestDto, examples: { submit: { summary: 'Submit a draft', value: { status: 'SUBMITTED' } }, approve: { summary: 'Approve after stock check', value: { status: 'APPROVED' } }, reject: { summary: 'Reject with reason', value: { status: 'REJECTED', note: 'The specification does not meet project requirements.' } }, query: { summary: 'Ask for more information', value: { status: 'QUERIED', note: 'Please provide a vendor quote.' } } } })
  @ApiResponse({ status: 200, description: 'Updated request. On review, reviewedBy, reviewedAt, reviewNote, and status are updated.', schema: resourceRequestResponseSchema })
  @ApiBadRequestResponse({ description: 'Invalid status transition, nothing to update, or incomplete submission.' })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  @ApiForbiddenResponse({ description: 'Caller does not own the request or is not its assigned line manager.' })
  @ApiNotFoundResponse({ description: 'Request does not exist.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, this.currentUser(req));
  }
}
