import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../users/user-role.enum';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('TeamsController', () => {
  let controller: TeamsController;
  const teamsService = {
    findUsers: jest.fn(),
    findProjects: jest.fn(),
    findResourceRequests: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    teamsService.findUsers.mockReset();
    teamsService.findProjects.mockReset();
    teamsService.findResourceRequests.mockReset();
    teamsService.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        { provide: TeamsService, useValue: teamsService },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: RolesGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
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

  it('passes the team id and authenticated user to the request lookup', async () => {
    const user = {
      sub: 'user-1',
      email: 'lead@example.com',
      role: UserRole.TEAM_LEAD,
    };

    await controller.findResourceRequests(
      4,
      { user } as AuthenticatedRequest,
    );

    expect(teamsService.findResourceRequests).toHaveBeenCalledWith(4, user);
  });

  it('passes the team id to the single-team lookup', async () => {
    await controller.findOne('4');

    expect(teamsService.findOne).toHaveBeenCalledWith(4);
  });
});
