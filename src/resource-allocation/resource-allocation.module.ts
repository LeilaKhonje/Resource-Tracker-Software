import { Module } from '@nestjs/common';
import { ResourceAllocationController } from './resource-allocation.controller';
import { ResourceAllocationService } from './resource-allocation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceRequest } from './resource-requests.entity';
@Module({
  imports: [TypeOrmModule.forFeature([ResourceRequest])],
import { ResourceAllocation } from './entity/ResourceAllocation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceAllocation])],
  controllers: [ResourceAllocationController],
  providers: [ResourceAllocationService],
  exports: [ResourceAllocationService, TypeOrmModule],
})
export class ResourceAllocationModule {}

