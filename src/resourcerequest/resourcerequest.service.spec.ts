import { Test, TestingModule } from '@nestjs/testing';
import { ResourcerequestService } from './resourcerequest.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResourceRequest } from './entities/resourcerequest.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Department } from '../departments/entities/department.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';

describe('ResourcerequestService', () => {
  let service: ResourcerequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcerequestService,
        ...[ResourceRequest, AuditLog, Department, Team, Project].map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: {},
        })),
      ],
    }).compile();

    service = module.get<ResourcerequestService>(ResourcerequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
