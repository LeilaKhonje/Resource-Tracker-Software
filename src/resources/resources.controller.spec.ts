import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourceType } from './enum/resource-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ResourcesController', () => {
  let controller: ResourcesController;

  const mockService = {
    createResource: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateResource: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get<ResourcesController>(ResourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates an insourced resource through the shared endpoint', async () => {
    const dto = {
      type: ResourceType.INSOURCED,
      name: 'Office laptop',
      description: 'Existing inventory',
      departmentName: 'Computing',
      quantity: 1,
    };
    mockService.createResource.mockResolvedValue({
      ...dto,
      status: 'AVAILABLE',
    });

    await controller.create(dto);

    expect(mockService.createResource).toHaveBeenCalledWith(dto);
  });

  it('creates an outsourced resource through the shared endpoint', async () => {
    const dto = {
      type: ResourceType.OUTSOURCED,
      name: 'Office laptop',
      price: 1250.5,
      label: 'Dell Latitude 5450',
      batchNumber: 'LOT-2026-04',
      vendor: 'Example Supplies Ltd',
      quantity: 3,
    };
    mockService.createResource.mockResolvedValue({
      ...dto,
      status: 'AVAILABLE',
    });

    await controller.create(dto);

    expect(mockService.createResource).toHaveBeenCalledWith(dto);
  });

  it('lists resources through the shared endpoint using the supplied filters', async () => {
    const query = { type: ResourceType.OUTSOURCED };
    mockService.findAll.mockResolvedValue([]);

    await controller.findAll(query);

    expect(mockService.findAll).toHaveBeenCalledWith(query);
  });

  it.each([
    [ResourceType.INSOURCED, { name: 'Updated laptop', description: 'Existing stock' }],
    [ResourceType.OUTSOURCED, { name: 'Updated laptop', price: 1400 }],
  ])('updates a %s resource through the shared endpoint', async (_type, dto) => {
    mockService.updateResource.mockResolvedValue(dto);

    await controller.updateResource('resource-id', dto);

    expect(mockService.updateResource).toHaveBeenCalledWith('resource-id', dto);
  });
});
