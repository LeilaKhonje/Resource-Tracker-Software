
import {Controller,Get,Query,Param,ParseIntPipe,} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('approval-history')
  getApprovalHistory(@Query() filter: ReportFilterDto) {
    return this.reportsService.getApprovalHistory(filter);
  }

  @Get('departmental-spending')
  getDepartmentalSpending(@Query() filter: ReportFilterDto) {
    return this.reportsService.getDepartmentalSpending(filter);
  }

  @Get('allocation-history')
  getAllocationHistory(@Query() filter: ReportFilterDto) {
    return this.reportsService.getAllocationHistory(filter);
  }

  @Get('department/:departmentId')
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
  getOrganizationReport(@Query() filter: ReportFilterDto) {
    return this.reportsService.getOrganizationReport(filter);
  }
}
