import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResourcesService } from './resources.service';
import { Resources } from './entities/resources.entity';
import { Department } from '../departments/entities/department.entity';

describe('ResourcesService', () => {
  let service: ResourcesService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResourcesService, {
        provide: getRepositoryToken(Resources),
        useValue: mockRepository,
      }, {
        provide: getRepositoryToken(Department),
        useValue: { find: jest.fn() },
      }, {
        provide: DataSource,
        useValue: {},
      }],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
