import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service'

describe('ResourcesController', () => {
  let controller: ResourcesController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: mockService}],
    }).compile();
    controller = module.get<ResourcesController>(ResourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
