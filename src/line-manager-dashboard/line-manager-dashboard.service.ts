import { Injectable } from '@nestjs/common';
import { RequestStatus, ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LineManagerDashboardService {
  getRequestDetails(id: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(ResourceRequest)
    private readonly resourceRequestRepository: Repository<ResourceRequest>,
  ) {}

  async getOverview() {
   const total = await this.resourceRequestRepository.count();
   const approved = await this.resourceRequestRepository.count({ where: { status: RequestStatus.APPROVED } });
   const rejected = await this.resourceRequestRepository.count({ where: { status: RequestStatus.REJECTED } });
   const queried = await this.resourceRequestRepository.count({ where: { status: RequestStatus.QUERIED } });
   const submitted = await this.resourceRequestRepository.count({ where: { status: RequestStatus.SUBMITTED } });
   return {
    total,
    approved,
    rejected,
    queried,
    submitted
   };
  }
  getAllRequests(status?: RequestStatus) {
    if (status) {
      return this.resourceRequestRepository.find({ where: { status } });
    }
    return this.resourceRequestRepository.find();
  }
  async approveRequest(id: string, dto: any) {
    await this.resourceRequestRepository.update(id, { status: RequestStatus.APPROVED });
    return this.resourceRequestRepository.findOne({ where: { id } });
}
async rejectRequest(id: string, dto: any) {
    await this.resourceRequestRepository.update(id, { status: RequestStatus.REJECTED });
    return this.resourceRequestRepository.findOne({ where: { id } });
}
async reviewRequest(id: string, dto: any) {
    await this.resourceRequestRepository.update(id, { status: RequestStatus.QUERIED } as any);
    return this.resourceRequestRepository.findOne({ where: { id } });
}
}