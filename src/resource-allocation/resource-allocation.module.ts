import { Module } from '@nestjs/common';
import { ResourceAllocationController } from './resource-allocation.controller';
import { ResourceAllocationService } from './resource-allocation.service';
import { ResourceAllocation } from './entity/ResourceAllocation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceAllocation])],
  controllers: [ResourceAllocationController],
  providers: [ResourceAllocationService],
  exports: [ResourceAllocationService, TypeOrmModule],
})
export class ResourceAllocationModule {}
