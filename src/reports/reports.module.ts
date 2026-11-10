import { Module } from '@nestjs/common';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthSecurityModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports:[ReportsService],
})
export class ReportsModule {}
