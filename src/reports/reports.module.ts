import { Module } from '@nestjs/common';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuthSecurityModule } from '../auth/auth-security.module';

@Module({
  imports: [AuthSecurityModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
