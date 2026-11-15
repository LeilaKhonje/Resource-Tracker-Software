import { Test, TestingModule } from '@nestjs/testing';
import { ResourcerequestService } from './resourcerequest.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResourceRequest } from './entities/resourcerequest.entity';
import { AuditLog } from '../auditlog/auditlog.entity';
import { Department } from '../departments/entities/department.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('ResourcerequestService', () => {
  let service: ResourcerequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcerequestService,
        { provide: NotificationsService, useValue: { createNotification: jest.fn() } },
        ...[ResourceRequest, AuditLog, Department, Team, Project, User].map((entity) => ({
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
