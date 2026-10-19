import { Test, TestingModule } from '@nestjs/testing';
import { LineManagerDashboardController } from './line-manager-dashboard.controller';
import { LineManagerDashboardService } from './line-manager-dashboard.service';

describe('LineManagerDashboardController', () => {
  let controller: LineManagerDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LineManagerDashboardController],
      providers: [LineManagerDashboardService, 
        {
          provide: LineManagerDashboardService,
          useValue: {
            getOverview: jest.fn(),
            getAllRequests: jest.fn(),
            approveRequest: jest.fn(),
            rejectRequest: jest.fn(),
            reviewRequest: jest.fn(),
          }
        }
      ],
    }).compile();

    controller = module.get<LineManagerDashboardController>(LineManagerDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
        });
