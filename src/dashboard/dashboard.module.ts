import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DepartmentsModule } from '../departments/departments.module';
import { AuthSecurityModule } from '../auth/auth-security.module';

@Module({
  imports: [DepartmentsModule, AuthSecurityModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
