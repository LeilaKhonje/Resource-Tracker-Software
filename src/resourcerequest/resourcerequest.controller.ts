import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  description: 'Temporary test login: e.g. lead-1 or manager-1',
  required: true,
})
@ApiHeader({
  name: 'x-user-role',
  description: 'Temporary test login: the role of the user',
  enum: UserRole,
  required: true,
})
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

  @ApiOperation({
    summary: 'Create a resource request',
    description:
      'A team lead creates a request for a resource and sends it to the line ' +
      'manager in one step. It must include the item details (description, ' +
      'manufacturer label, price, batch number, vendor, quantity), the ' +
      'project, the line manager who will review it, and the team and ' +
      'department it comes from. The request starts with status SUBMITTED.',
  })
  @ApiResponse({
    status: 201,
    description: 'Request created and submitted to the line manager.',
  })
  @ApiResponse({ status: 400, description: 'A required field is missing or invalid.' })
  @ApiResponse({ status: 401, description: 'Not logged in.' })
  @ApiResponse({ status: 403, description: 'Only team leads can create requests.' })
  @Post()
  create(@Body() dto: CreateResourceRequestDto, @Req() req: any) {
    return this.service.create(dto, this.currentUser(req));
  }

  @ApiOperation({
    summary: 'List resource requests',
    description:
      'Returns the requests the logged-in user is allowed to see. Team leads ' +
      'see the requests they created. Line managers see the requests routed ' +
      'to them. Department heads and the managing director see all ' +
      'requests. Results can be filtered by status or team.',
  })
  @ApiResponse({ status: 200, description: 'List of requests, newest first.' })
  @ApiResponse({ status: 401, description: 'Not logged in.' })
  @Get()
  findAll(@Query() query: QueryResourceRequestDto, @Req() req: any) {
    return this.service.findAll(query, this.currentUser(req));
  }

  @ApiOperation({
    summary: 'Get one resource request',
    description:
      'Returns a single request with its current status (SUBMITTED, QUERIED, ' +
      "APPROVED or REJECTED), including the line manager's note if there is " +
      'one. Add include=audit to also return the full history of actions ' +
      'taken on the request. Only the owner, the assigned line manager and ' +
      'senior roles can view a request.',
  })
  @ApiParam({ name: 'id', description: 'The id of the request (a UUID).' })
  @ApiQuery({
    name: 'include',
    required: false,
    enum: ['audit'],
    description: 'Set to audit to include the audit trail.',
  })
  @ApiResponse({
    status: 200,
    description: 'The request, with its audit trail if asked.',
  })
  @ApiResponse({ status: 400, description: 'The id is not a valid UUID.' })
  @ApiResponse({ status: 403, description: 'You are not allowed to view this request.' })
  @ApiResponse({ status: 404, description: 'No request with this id.' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('include') include: string | undefined,
    @Req() req: any,
  ) {
    return this.service.findOne(id, this.currentUser(req), include === 'audit');
  }

  @ApiOperation({
    summary: 'Edit and resubmit, or review, a resource request',
    description:
      'The one endpoint for changing a request. Team lead: after a line ' +
      'manager queries a request (status QUERIED), send the fields to edit ' +
      'and status SUBMITTED to send it back for review. Line manager: send ' +
      'status APPROVED, REJECTED or QUERIED for a SUBMITTED request; a note ' +
      'is required for REJECTED and QUERIED. A review decision cannot be ' +
      'combined with edits. A request can only be edited while it is ' +
      'QUERIED, and APPROVED or REJECTED requests are final.',
  })
  @ApiParam({ name: 'id', description: 'The id of the request (a UUID).' })
  @ApiResponse({ status: 200, description: 'The updated request.' })
  @ApiResponse({
    status: 400,
    description:
      'Nothing to update, a required note is missing, the request cannot be ' +
      'edited in its current status, or it is missing a team, department, ' +
      'project or line manager.',
  })
  @ApiResponse({ status: 403, description: 'This role cannot make that change.' })
  @ApiResponse({ status: 404, description: 'No request with this id.' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceRequestDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, this.currentUser(req));
  }
}