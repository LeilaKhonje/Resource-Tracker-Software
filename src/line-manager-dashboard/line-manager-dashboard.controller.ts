
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { LineManagerDashboardService } from './line-manager-dashboard.service';
import { QueryResourceRequestsDto } from './dto/QueryResourceRequestsDto';
import { ReviewResourceRequestDto } from './dto/ReviewResourceRequestDto';
import { RejectResourceRequestDto } from './dto/RejectResourceRequestsDto';
import { RequestStatus } from '../resourcerequest/entities/resourcerequest.entity';

class ApproveResourceRequestDto {
  comment?: string;
}

@Controller('line-manager')
export class LineManagerDashboardController {
  constructor(
    private readonly lineManagerService: LineManagerDashboardService,
  ) {}

  // Dashboard overview
  @Get('overview')
  getOverview() {
    return this.lineManagerService.getOverview();
  }

  // Resources grouped by department
  //@Get('departments/resources')
  //getDepartmentResources() {
    //return this.lineManagerService.getDepartmentResources();
  //}

  @Get('requests')
  GetRequests(@Query('status') status?: RequestStatus) {
    return this.lineManagerService.getAllRequests(status);
  }

  @Get('requests/:id')
  getRequestDetails(@Param('id') id: string) {
    return this.lineManagerService.getRequestDetails(id);
  }

  // Save review comments
  @Patch('requests/:id/review')
  reviewRequest(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.lineManagerService.reviewRequest(id, dto);
  }

  @Patch('requests/:id/approve')
  approveRequest(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.lineManagerService.approveRequest(id, dto);
  }

  @Patch('requests/:id/reject')
  rejectRequest(
    @Param('id') id: string,
    @Body() dto: RejectResourceRequestDto,
  ) {
    return this.lineManagerService.rejectRequest(id, dto);
  }
}

