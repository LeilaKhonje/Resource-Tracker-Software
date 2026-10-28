
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { LineManagerDashboardService } from './line-manager-dashboard.service';
import { QueryResourceRequestsDto } from './dto/QueryResourceRequestsDto';
import { RejectResourceRequestDto } from './dto/RejectResourceRequestsDto';
import { AllocationStatus } from '../resource-allocation/entity/ResourceAllocation.entity';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

class ApproveResourceRequestDto {
  comment?: string;
}

@Controller('line-manager')
@ApiTags('Line Manager')
export class LineManagerDashboardController {
  constructor(
    private readonly lineManagerService: LineManagerDashboardService,
  ) {}

  // Dashboard overview
  @Get('overview')
  @ApiOperation({ summary: 'Get the line manager dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview counts', schema: { type: 'object', properties: { total: { type: 'integer' }, approved: { type: 'integer' }, rejected: { type: 'integer' }, queried: { type: 'integer' }, allocated: { type: 'integer' } } } })
  getOverview() {
    return this.lineManagerService.getOverview();
  }

  // Resources grouped by department
  //@Get('departments/resources')
  //getDepartmentResources() {
    //return this.lineManagerService.getDepartmentResources();
  //}

  @Get('requests')
  @ApiOperation({ summary: 'List resource requests' })
  @ApiQuery({ name: 'status', required: false, enum: AllocationStatus, description: 'Filter requests by status' })
  @ApiResponse({ status: 200, description: 'Resource allocation records', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, resourceName: { type: 'string' }, resourceType: { type: 'string', nullable: true }, quantity: { type: 'integer' }, status: { type: 'string', enum: Object.values(AllocationStatus) }, requestedById: { type: 'integer' }, departmentId: { type: 'integer', nullable: true }, teamId: { type: 'integer', nullable: true }, createdAt: { type: 'string', format: 'date-time' } }, additionalProperties: true } } })
  getRequests(@Query('status') status?: AllocationStatus) {
    return this.lineManagerService.getAllRequests(status);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get resource request details' })
  @ApiParam({ name: 'id', description: 'Numeric resource allocation ID', type: Number })
  @ApiResponse({ status: 500, description: 'Request detail method is not implemented' })
  getRequestDetails(@Param('id') id: string) {
    return this.lineManagerService.getRequestDetails(id);
  }

  // Save review comments
  @Patch('requests/:id/review')
  @ApiOperation({ summary: 'Save a review for a resource request' })
  @ApiParam({ name: 'id', description: 'Numeric resource allocation ID', type: Number })
  @ApiBody({ schema: { type: 'object', properties: { comment: { type: 'string', example: 'Please confirm the budget code.' } } } })
  @ApiResponse({ status: 200, description: 'Updated resource allocation record', schema: { type: 'object', properties: { id: { type: 'integer' }, status: { type: 'string', enum: Object.values(AllocationStatus) } }, additionalProperties: true } })
  reviewRequest(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.lineManagerService.reviewRequest(id, dto);
  }

  @Patch('requests/:id/approve')
  @ApiOperation({ summary: 'Approve a resource request' })
  @ApiParam({ name: 'id', description: 'Numeric resource allocation ID', type: Number })
  @ApiBody({ schema: { type: 'object', properties: { comment: { type: 'string', example: 'Approved for this quarter.' } } } })
  @ApiResponse({ status: 200, description: 'Updated resource allocation record', schema: { type: 'object', properties: { id: { type: 'integer' }, status: { type: 'string', enum: Object.values(AllocationStatus) } }, additionalProperties: true } })
  approveRequest(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.lineManagerService.approveRequest(id, dto);
  }

  @Patch('requests/:id/reject')
  @ApiOperation({ summary: 'Reject a resource request' })
  @ApiParam({ name: 'id', description: 'Numeric resource allocation ID', type: Number })
  @ApiBody({ type: RejectResourceRequestDto })
  @ApiResponse({ status: 200, description: 'Updated resource allocation record', schema: { type: 'object', properties: { id: { type: 'integer' }, status: { type: 'string', enum: Object.values(AllocationStatus) } }, additionalProperties: true } })
  @ApiResponse({ status: 400, description: 'Reason must be a string from 1 to 500 characters' })
  rejectRequest(
    @Param('id') id: string,
    @Body() dto: RejectResourceRequestDto,
  ) {
    return this.lineManagerService.rejectRequest(id, dto);
  }
}

