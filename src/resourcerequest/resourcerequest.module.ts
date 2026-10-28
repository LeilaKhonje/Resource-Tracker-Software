import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcerequestController } from './resourcerequest.controller';
import { ResourcerequestService } from './resourcerequest.service';
import { ResourceRequest } from './entities/resourcerequest.entity';
import { AuditLog } from '../auditlog/auditlog.entity';


@Module({
  imports: [TypeOrmModule.forFeature([ResourceRequest, AuditLog])],
  controllers: [ResourcerequestController],
  providers: [ResourcerequestService],
  exports: [ResourcerequestService],
})
export class ResourcerequestModule {}
