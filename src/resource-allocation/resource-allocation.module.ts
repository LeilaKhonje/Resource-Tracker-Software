import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceAllocation } from './entity/ResourceAllocation.entity';
import { ResourceAllocationController } from './resource-allocation.controller';
import { ResourceAllocationService } from './resource-allocation.service';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceAllocation])],
  controllers: [ResourceAllocationController],
  providers: [ResourceAllocationService],
  exports: [ResourceAllocationService, TypeOrmModule],
})
export class ResourceAllocationModule {}
