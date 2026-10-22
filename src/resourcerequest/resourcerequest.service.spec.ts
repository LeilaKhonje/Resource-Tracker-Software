import { Test, TestingModule } from '@nestjs/testing';
import { ResourcerequestService } from './resourcerequest.service';

describe('ResourcerequestService', () => {
  let service: ResourcerequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResourcerequestService],
    }).compile();

    service = module.get<ResourcerequestService>(ResourcerequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
