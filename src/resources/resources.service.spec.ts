import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResourcesService } from './resources.service';
import { Resources } from './entities/resources.entity';
import { Department } from '../departments/entities/department.entity';
import { DataSource } from 'typeorm';
import { EmailService } from '../email/email.service';
import { ResourceType } from './enum/resource-type.enum';

describe('ResourcesService', () => {
  let service: ResourcesService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const mockDepartmentRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.create.mockImplementation((resource) => resource);
    mockRepository.save.mockImplementation(async (resource) => resource);
    mockDepartmentRepository.find.mockResolvedValue([
      { id: 'department-id', name: 'Computing' },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ResourcesService, {
        provide: getRepositoryToken(Resources),
        useValue: mockRepository,
      }, {
        provide: getRepositoryToken(Department),
        useValue: mockDepartmentRepository,
      }, {
        provide: DataSource,
        useValue: {},
      }, {
        provide: EmailService,
        useValue: { send: jest.fn() },
      }],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an insourced resource through the shared service method', async () => {
    const dto = {
      type: ResourceType.INSOURCED,
      name: ' Office laptop ',
      description: ' Existing inventory ',
      departmentName: ' Computing ',
      quantity: 1,
    };

    await service.createResource(dto);

    expect(mockRepository.create).toHaveBeenCalledWith({
      name: 'Office laptop',
      type: ResourceType.INSOURCED,
      description: 'Existing inventory',
      department: { id: 'department-id', name: 'Computing' },
      quantity: 1,
    });
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('creates an outsourced resource through the shared service method', async () => {
    const dto = {
      type: ResourceType.OUTSOURCED,
      name: ' Office laptop ',
      price: 1250.5,
      label: ' Dell Latitude ',
      batchNumber: ' LOT-2026-04 ',
      vendor: ' Example Supplies Ltd ',
      quantity: 3,
    };

    await service.createResource(dto);

    expect(mockRepository.create).toHaveBeenCalledWith({
      name: 'Office laptop',
      type: ResourceType.OUTSOURCED,
      price: 1250.5,
      label: 'Dell Latitude',
      batchNumber: 'LOT-2026-04',
      vendor: 'Example Supplies Ltd',
      quantity: 3,
    });
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
