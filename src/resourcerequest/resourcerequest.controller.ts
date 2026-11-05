import {Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UnauthorizedException,} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiForbiddenResponse, ApiHeader, ApiNotFoundResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResourcerequestService } from './resourcerequest.service';
import { CreateResourceRequestDto } from './dto/create-resourcerequest.dto';
import { UpdateResourceRequestDto } from './dto/update-resourcerequest.dto';
import { QueryResourceRequestDto } from './dto/query-resourcerequest.dto';
import { AuthUser, UserRole } from './roles';

// TODO: once the auth guard is connected, add @UseGuards(...) at class level
// and delete the header fallback in currentUser() plus the two @ApiHeader
// decorators below.

@ApiTags('Resource Requests')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-user-id',
  description: 'Legacy caller ID used when no JWT user is attached.',
  required: false,
})
@ApiHeader({ name: 'x-user-role', enum: UserRole, required: false, description: 'Legacy uppercase role used with x-user-id.' })
@Controller('resource-requests')
export class ResourcerequestController {
  constructor(private readonly service: ResourcerequestService) {}

  // Reads the logged-in user. The real auth guard puts it on req.user.
  // Until it is connected, the two test headers are used instead.
  // REMOVE the header fallback before the final submission.
  private currentUser(req: any): AuthUser {
    if (req.user) return req.user as AuthUser;

    const id = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    if (!id || !Object.values(UserRole).includes(role)) {
      throw new UnauthorizedException('No logged-in user');
    }
    return { id, role } as AuthUser;
  }

  
  @Post('api/v1/resource-request')
  @ApiOperation({ summary: 'Create a resource request draft', description: 'Team leads create drafts. The server sets requestedBy from the caller.' })
  @ApiBody({ type: CreateResourceRequestDto, examples: { laptopRequest: { summary: 'Request laptops', value: { itemDescription: 'Laptop for field data collection', manufacturerLabel: 'ThinkPad T14', price: 1200, batchNumber: 'LOT-2026-04', vendor: 'Example Supplies', quantity: 3, projectId: '12', lineManagerId: 'b9ca58fa-1a9a-4e5e-ad3e-badb621d783f', teamId: '8', departmentId: '2' } } } })
  @ApiResponse({ status: 201, description: 'Draft created with status DRAFT.' })
  @ApiBadRequestResponse({ description: 'Invalid fields, unknown catalog resource, or inconsistent team/department/project references.' })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  @ApiForbiddenResponse({ description: 'Only team leads can create requests.' })
  create(@Body() dto: CreateResourceRequestDto, @Req() req: any) {
    return this.service.create(dto, this.currentUser(req));
  }

 
  @Get('api/v1/resource-request')
  @ApiOperation({ summary: 'List requests visible to the caller', description: 'Team leads see their own requests; line managers see requests routed to them; department heads and managing directors currently see all requests.' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'QUERIED', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'teamId', required: false, type: String, description: 'Filter by numeric team ID.' })
  @ApiResponse({ status: 200, description: 'Requests ordered newest first.' })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  findAll(@Query() query: QueryResourceRequestDto, @Req() req: any) {
    return this.service.findAll(query, this.currentUser(req));
  }

  
  @ApiQuery({ name: 'include', required: false, enum: ['audit'] })
  @Get('api/v1/resource-request/:id')
  @ApiOperation({ summary: 'Get a resource request', description: 'Pass include=audit to attach the request audit trail in chronological order.' })
  @ApiResponse({ status: 200, description: 'Request details; includes auditTrail when requested.' })
  @ApiBadRequestResponse({ description: 'Request ID is not a UUID.' })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  @ApiForbiddenResponse({ description: 'Caller is not the requester, assigned line manager, department head, or managing director.' })
  @ApiNotFoundResponse({ description: 'Request does not exist.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('include') include: string | undefined,
    @Req() req: any,
  ) {
    return this.service.findOne(id, this.currentUser(req), include === 'audit');
  }

  
  @Patch('api/v1/resource-request/:id')
  @ApiOperation({ summary: 'Edit, submit, or review a resource request', description: 'Team leads may edit DRAFT or QUERIED requests and submit with status SUBMITTED. The assigned line manager may review a SUBMITTED request with APPROVED, REJECTED, or QUERIED. Rejection and query require a note.' })
  @ApiBody({ type: UpdateResourceRequestDto, examples: { submit: { summary: 'Submit a draft', value: { status: 'SUBMITTED' } }, approve: { summary: 'Approve after stock check', value: { status: 'APPROVED' } }, reject: { summary: 'Reject with reason', value: { status: 'REJECTED', note: 'The specification does not meet project requirements.' } }, query: { summary: 'Ask for more information', value: { status: 'QUERIED', note: 'Please provide a vendor quote.' } } } })
  @ApiResponse({ status: 200, description: 'Updated request. On review, reviewedBy, reviewedAt, reviewNote, and status are updated.' })
  @ApiBadRequestResponse({ description: 'Invalid status transition, nothing to update, or incomplete submission.' })
  @ApiUnauthorizedResponse({ description: 'No caller identity was supplied.' })
  @ApiForbiddenResponse({ description: 'Caller does not own the request or is not its assigned line manager.' })
  @ApiNotFoundResponse({ description: 'Request does not exist.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceRequestDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, this.currentUser(req));
  }
}
