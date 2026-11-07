import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcerequestController } from './resourcerequest.controller';
import { ResourcerequestService } from './resourcerequest.service';
import { ResourceRequest } from './entities/resourcerequest.entity';
import { RequestAuditLog } from './entities/request-audit-log.entity';
import { AuthSecurityModule } from '../auth/auth-security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResourceRequest, RequestAuditLog]),
    AuthSecurityModule,
  ],
  controllers: [ResourcerequestController],
  providers: [ResourcerequestService],
  exports: [ResourcerequestService],
})
export class ResourcerequestModule {}