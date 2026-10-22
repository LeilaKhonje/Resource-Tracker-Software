import { Injectable } from '@nestjs/common';
import { ResourceAllocation, AllocationStatus } from '../resource-allocation/entity/ResourceAllocation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LineManagerDashboardService {
  getRequestDetails(id: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(ResourceAllocation)
    private readonly resourceAllocationRepository: Repository<ResourceAllocation>,
  ) {}

  async getOverview() {
   const total = await this.resourceAllocationRepository.count();
   const approved = await this.resourceAllocationRepository.count({ where: { status: AllocationStatus.APPROVED } });
   const rejected = await this.resourceAllocationRepository.count({ where: { status: AllocationStatus.REJECTED } });
   const queried = await this.resourceAllocationRepository.count({ where: { status: AllocationStatus.QUERIED } });
   const allocated = await this.resourceAllocationRepository.count({ where: { status: AllocationStatus.ALLOCATED } });
   return {
    total,
    approved,
    rejected,
    queried,
    allocated
   };
  }
  getAllRequests(status?: AllocationStatus) {
    if (status) {
      return this.resourceAllocationRepository.find({ where: { status } });
    }
    return this.resourceAllocationRepository.find();
  }
  async approveRequest(id: string, dto: any) {
    await this.resourceAllocationRepository.update(id, { status: AllocationStatus.APPROVED });
    return this.resourceAllocationRepository.findOne({ where: { id: Number(id) } });
}
async rejectRequest(id: string, dto: any) {
    await this.resourceAllocationRepository.update(id, { status: AllocationStatus.REJECTED });
    return this.resourceAllocationRepository.findOne({ where: { id: Number(id) } });
}
async reviewRequest(id: string, dto: any) {
    await this.resourceAllocationRepository.update(id, { status: AllocationStatus.QUERIED } as any);
    return this.resourceAllocationRepository.findOne({ where: { id: Number(id) } });
}
}