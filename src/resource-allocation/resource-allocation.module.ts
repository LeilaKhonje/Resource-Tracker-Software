import { Module } from '@nestjs/common';
import { ResourceAllocationController } from './resource-allocation.controller';
import { ResourceAllocationService } from './resource-allocation.service';

@Module({
  controllers: [ResourceAllocationController],
  providers: [ResourceAllocationService]
})
export class ResourceAllocationModule {}
