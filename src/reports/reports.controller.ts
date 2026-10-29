
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
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date', example: '2026-01-01', description: 'Inclusive start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date', example: '2026-01-31', description: 'Inclusive end date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Approval history rows', schema: { type: 'array', items: { type: 'object', properties: { department_id: { type: 'integer' } }, additionalProperties: true } } })
  @ApiResponse({ status: 400, description: 'Invalid departmentId or date format' })
  getApprovalHistory(@Query() filter: ReportFilterDto) {
    return this.reportsService.getApprovalHistory(filter);
  }

  @Get('departmental-spending')
  @ApiOperation({ summary: 'Get departmental spending' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date', example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date', example: '2026-01-31' })
  @ApiResponse({ status: 200, description: 'Departmental spending rows', schema: { type: 'array', items: { type: 'object', properties: { departmentId: { type: 'integer' }, departmentName: { type: 'string' }, totalSpending: { type: 'number' } } } } })
  @ApiResponse({ status: 400, description: 'Invalid departmentId or date format' })
  getDepartmentalSpending(@Query() filter: ReportFilterDto) {
    return this.reportsService.getDepartmentalSpending(filter);
  }

  @Get('allocation-history')
  @ApiOperation({ summary: 'Get resource allocation history' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date', example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date', example: '2026-01-31' })
  @ApiResponse({ status: 200, description: 'Allocation history rows', schema: { type: 'array', items: { type: 'object', properties: { department_id: { type: 'integer' } }, additionalProperties: true } } })
  @ApiResponse({ status: 400, description: 'Invalid departmentId or date format' })
  getAllocationHistory(@Query() filter: ReportFilterDto) {
    return this.reportsService.getAllocationHistory(filter);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get a report for one department' })
  @ApiParam({ name: 'departmentId', description: 'Department ID', type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Department report', schema: { type: 'object', properties: { departmentId: { type: 'integer' }, approvals: { type: 'array', items: { type: 'object', additionalProperties: true } }, spending: { type: 'array', items: { type: 'object', properties: { departmentId: { type: 'integer' }, departmentName: { type: 'string' }, totalSpending: { type: 'number' } } } }, allocations: { type: 'array', items: { type: 'object', additionalProperties: true } } } } })
  @ApiResponse({ status: 400, description: 'Department ID must be an integer; date filters must use ISO 8601' })
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
  @ApiResponse({ status: 200, description: 'Organization report', schema: { type: 'object', properties: { approvals: { type: 'array', items: { type: 'object', additionalProperties: true } }, spending: { type: 'array', items: { type: 'object', properties: { departmentId: { type: 'integer' }, departmentName: { type: 'string' }, totalSpending: { type: 'number' } } } }, allocations: { type: 'array', items: { type: 'object', additionalProperties: true } } } } })
  @ApiResponse({ status: 400, description: 'Invalid departmentId or date format' })
  getOrganizationReport(@Query() filter: ReportFilterDto) {
    return this.reportsService.getOrganizationReport(filter);
  }
}
