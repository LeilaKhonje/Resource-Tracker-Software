import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { User } from '../users/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let departmentRepository: jest.Mocked<
    Pick<Repository<Department>, 'findOne'>
  >;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'find'>>;
  let teamRepository: jest.Mocked<
    Pick<Repository<Team>, 'find' | 'findOne'>
  >;
  let projectRepository: jest.Mocked<Pick<Repository<Project>, 'find'>>;

  beforeEach(async () => {
    departmentRepository = {
      findOne: jest.fn(),
    };
    userRepository = {
      find: jest.fn(),
    };
    teamRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    projectRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getRepositoryToken(Department),
          useValue: departmentRepository,
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Team), useValue: teamRepository },
        { provide: getRepositoryToken(Project), useValue: projectRepository },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns users belonging to the requested department', async () => {
    const department = { id: 4, name: 'Finance' };
    const users = [{ id: 'user-1', fullName: 'Alex Example' }];
    departmentRepository.findOne.mockResolvedValue(department as Department);
    userRepository.find.mockResolvedValue(users as User[]);

    await expect(service.findUsers(4)).resolves.toBe(users);
    expect(departmentRepository.findOne).toHaveBeenCalledWith({
      where: { id: 4 },
    });
    expect(userRepository.find).toHaveBeenCalledWith({
      where: { department: { id: 4 } },
    });
  });

  it('returns teams belonging to the requested department', async () => {
    const department = { id: 4, name: 'Finance' };
    const teams = [{ id: 2, name: 'Accounts' }];
    departmentRepository.findOne.mockResolvedValue(department as Department);
    teamRepository.find.mockResolvedValue(teams as Team[]);

    await expect(service.findTeams(4)).resolves.toBe(teams);
    expect(departmentRepository.findOne).toHaveBeenCalledWith({
      where: { id: 4 },
    });
    expect(teamRepository.find).toHaveBeenCalledWith({
      where: { department: { id: 4 } },
    });
  });

  it('returns projects assigned to teams in the requested department', async () => {
    const department = { id: 4, name: 'Finance' };
    const team = { id: 2, name: 'Accounts', department };
    const projects = [{ id: 7, name: 'Budget System', teams: [team] }];
    departmentRepository.findOne.mockResolvedValue(department as Department);
    projectRepository.find.mockResolvedValue(projects as Project[]);

    await expect(service.findProjects(4)).resolves.toBe(projects);
    expect(departmentRepository.findOne).toHaveBeenCalledWith({
      where: { id: 4 },
    });
    expect(projectRepository.find).toHaveBeenCalledWith({
      where: { teams: { department: { id: 4 } } },
      relations: { teams: true },
    });
  });

  it('returns projects for a team in the requested department', async () => {
    const department = { id: 4, name: 'Finance' };
    const team = { id: 2, name: 'Accounts', department };
    const projects = [{ id: 7, name: 'Budget System', teams: [team] }];
    departmentRepository.findOne.mockResolvedValue(department as Department);
    teamRepository.findOne.mockResolvedValue(team as Team);
    projectRepository.find.mockResolvedValue(projects as Project[]);

    await expect(service.findTeamProjects(4, 2)).resolves.toBe(projects);
    expect(teamRepository.findOne).toHaveBeenCalledWith({
      where: { id: 2, department: { id: 4 } },
    });
    expect(projectRepository.find).toHaveBeenCalledWith({
      where: { teams: { id: 2 } },
      relations: { teams: true },
    });
  });
});
