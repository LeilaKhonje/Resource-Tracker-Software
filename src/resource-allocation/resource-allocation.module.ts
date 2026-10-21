import { Module } from '@nestjs/common';
import { ResourceAllocationController } from './resource-allocation.controller';
import { ResourceAllocationService } from './resource-allocation.service';
import { ResourceAllocation } from './entity/ResourceAllocation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { ResourceAllocation } from './entities/resource-allocation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceAllocation])],
  controllers: [ResourceAllocationController],
  providers: [ResourceAllocationService],
  exports: [ResourceAllocationService, TypeOrmModule],
})
export class ResourceAllocationModule {}
