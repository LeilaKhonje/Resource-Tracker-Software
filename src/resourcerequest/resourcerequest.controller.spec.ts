import { Test, TestingModule } from '@nestjs/testing';
import { ResourcerequestController } from './resourcerequest.controller';

describe('ResourcerequestController', () => {
  let controller: ResourcerequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcerequestController],
    }).compile();

    controller = module.get<ResourcerequestController>(ResourcerequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
