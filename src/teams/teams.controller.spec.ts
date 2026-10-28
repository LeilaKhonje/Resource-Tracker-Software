import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;
  const teamsService = {
    findUsers: jest.fn(),
    findProjects: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    teamsService.findUsers.mockReset();
    teamsService.findProjects.mockReset();
    teamsService.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: teamsService }],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the team id to the user lookup', async () => {
    await controller.findUsers('4');

    expect(teamsService.findUsers).toHaveBeenCalledWith(4);
  });

  it('passes the team id to the project lookup', async () => {
    await controller.findProjects('4');

    expect(teamsService.findProjects).toHaveBeenCalledWith(4);
  });

  it('passes the team id to the single-team lookup', async () => {
    await controller.findOne('4');

    expect(teamsService.findOne).toHaveBeenCalledWith(4);
  });
});
