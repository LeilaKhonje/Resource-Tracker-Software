import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../users/user-role.enum';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  const departmentsService = {
    findOne: jest.fn(),
    findUsers: jest.fn(),
    findTeams: jest.fn(),
    findProjects: jest.fn(),
    findResourceRequests: jest.fn(),
    findTeamProjects: jest.fn(),
  };

  beforeEach(async () => {
    departmentsService.findOne.mockReset();
    departmentsService.findUsers.mockReset();
    departmentsService.findTeams.mockReset();
    departmentsService.findProjects.mockReset();
    departmentsService.findResourceRequests.mockReset();
    departmentsService.findTeamProjects.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        { provide: DepartmentsService, useValue: departmentsService },
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

    controller = module.get<DepartmentsController>(DepartmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the department id to the single department lookup', async () => {
    await controller.findOne('4');

    expect(departmentsService.findOne).toHaveBeenCalledWith(4);
  });

  it('passes the department id to the user lookup', async () => {
    await controller.findUsers('4');

    expect(departmentsService.findUsers).toHaveBeenCalledWith(4);
  });

  it('passes the department id to the team lookup', async () => {
    await controller.findTeams('4');

    expect(departmentsService.findTeams).toHaveBeenCalledWith(4);
  });

  it('passes the department id to the project lookup', async () => {
    await controller.findProjects('4');

    expect(departmentsService.findProjects).toHaveBeenCalledWith(4);
  });

  it('passes the department id and authenticated user to the request lookup', async () => {
    const user = {
      sub: 'user-1',
      email: 'head@example.com',
      role: UserRole.DEPARTMENT_HEAD,
    };

    await controller.findResourceRequests(
      4,
      { user } as AuthenticatedRequest,
    );

    expect(departmentsService.findResourceRequests).toHaveBeenCalledWith(4, user);
  });

  it('passes department and team ids to the project lookup', async () => {
    await controller.findTeamProjects('4', '2');

    expect(departmentsService.findTeamProjects).toHaveBeenCalledWith(4, 2);
  });
});
