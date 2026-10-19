import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { LineManagerDashboardService } from './line-manager-dashboard.service';

describe('LineManagerDashboardService', () => {
  let service: LineManagerDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineManagerDashboardService,
        {
          provide: getRepositoryToken(ResourceRequest),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LineManagerDashboardService>(LineManagerDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
