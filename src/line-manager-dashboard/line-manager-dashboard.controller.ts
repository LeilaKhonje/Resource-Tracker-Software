
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { LineManagerDashboardService } from './line-manager-dashboard.service';
import { QueryResourceRequestsDto } from './dto/QueryResourceRequestsDto';
import { RejectResourceRequestDto } from './dto/RejectResourceRequestsDto';
import { RequestStatus } from '../resourcerequest/entities/resourcerequest.entity';
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
  @ApiResponse({ status: 200, description: 'Dashboard overview returned' })
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
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus, description: 'Filter requests by status' })
  @ApiResponse({ status: 200, description: 'Requests returned' })
  GetRequests(@Query('status') status?: RequestStatus) {
  GetRequests(
    @Query('status')
    status?: Parameters<LineManagerDashboardService['getAllRequests']>[0],
  ) {
    return this.lineManagerService.getAllRequests(status);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get resource request details' })
  @ApiParam({ name: 'id', description: 'Resource request ID' })
  @ApiResponse({ status: 200, description: 'Request details returned' })
  getRequestDetails(@Param('id') id: string) {
    return this.lineManagerService.getRequestDetails(id);
  }

  // Save review comments
  @Patch('requests/:id/review')
  @ApiOperation({ summary: 'Save a review for a resource request' })
  @ApiParam({ name: 'id', description: 'Resource request ID' })
  @ApiBody({ schema: { type: 'object', properties: { comment: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Review saved' })
  reviewRequest(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.lineManagerService.reviewRequest(id, dto);
  }

  @Patch('requests/:id/approve')
  @ApiOperation({ summary: 'Approve a resource request' })
  @ApiParam({ name: 'id', description: 'Resource request ID' })
  @ApiBody({ schema: { type: 'object', properties: { comment: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Request approved' })
  approveRequest(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.lineManagerService.approveRequest(id, dto);
  }

  @Patch('requests/:id/reject')
  @ApiOperation({ summary: 'Reject a resource request' })
  @ApiParam({ name: 'id', description: 'Resource request ID' })
  @ApiBody({ type: RejectResourceRequestDto })
  @ApiResponse({ status: 200, description: 'Request rejected' })
  rejectRequest(
    @Param('id') id: string,
    @Body() dto: RejectResourceRequestDto,
  ) {
    return this.lineManagerService.rejectRequest(id, dto);
  }
}

