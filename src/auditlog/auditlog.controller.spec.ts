import { Test, TestingModule } from '@nestjs/testing';
import { AuditlogController } from './auditlog.controller';

describe('AuditlogController', () => {
  let controller: AuditlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditlogController],
    }).compile();

    controller = module.get<AuditlogController>(AuditlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
