import { Module } from '@nestjs/common';
import { ResourceAllocationController } from './resource-allocation.controller';
import { ResourceAllocationService } from './resource-allocation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceRequest } from './resource-requests.entity';
@Module({
  imports: [TypeOrmModule.forFeature([ResourceRequest])],
  controllers: [ResourceAllocationController],
  providers: [ResourceAllocationService]
})
export class ResourceAllocationModule {}

