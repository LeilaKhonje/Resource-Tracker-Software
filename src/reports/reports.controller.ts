
import {Controller,Get,Query,Param,ParseIntPipe,} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('approval-history')
  @ApiOperation({ summary: 'Get resource request approval history' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date in ISO 8601 format' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date in ISO 8601 format' })
  @ApiResponse({ status: 200, description: 'Approval history returned' })
  getApprovalHistory(@Query() filter: ReportFilterDto) {
    return this.reportsService.getApprovalHistory(filter);
  }

  @Get('departmental-spending')
  @ApiOperation({ summary: 'Get departmental spending' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Departmental spending returned' })
  getDepartmentalSpending(@Query() filter: ReportFilterDto) {
    return this.reportsService.getDepartmentalSpending(filter);
  }

  @Get('allocation-history')
  @ApiOperation({ summary: 'Get resource allocation history' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Allocation history returned' })
  getAllocationHistory(@Query() filter: ReportFilterDto) {
    return this.reportsService.getAllocationHistory(filter);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get a report for one department' })
  @ApiParam({ name: 'departmentId', description: 'Department ID', type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Department report returned' })
  getDepartmentReport(
    @Param('departmentId', ParseIntPipe) departmentId: number,
    @Query() filter: ReportFilterDto,
  ) {
    return this.reportsService.getDepartmentReport(
      departmentId,
      filter,
    );
  }

  @Get('organization')
  @ApiOperation({ summary: 'Get the organization report' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Organization report returned' })
  getOrganizationReport(@Query() filter: ReportFilterDto) {
    return this.reportsService.getOrganizationReport(filter);
  }
}
