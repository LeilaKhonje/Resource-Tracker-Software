import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Team } from './entities/team.entity';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamRepository: jest.Mocked<Pick<Repository<Team>, 'find' | 'findOne'>>;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'find'>>;
  let projectRepository: jest.Mocked<Pick<Repository<Project>, 'find'>>;

  beforeEach(async () => {
    teamRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    userRepository = {
      find: jest.fn(),
    };
    projectRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(Team), useValue: teamRepository },
        { provide: getRepositoryToken(Department), useValue: {} },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Project), useValue: projectRepository },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('includes the department when listing teams', async () => {
    const teams = [{ id: 1, name: 'Platform', department: { id: 3, name: 'IT' } }];
    teamRepository.find.mockResolvedValue(teams as Team[]);

    await expect(service.findAll()).resolves.toBe(teams);
    expect(teamRepository.find).toHaveBeenCalledWith({
      relations: { department: true },
    });
  });

  it('includes the department when finding a team by id', async () => {
    const team = { id: 1, name: 'Platform', department: { id: 3, name: 'IT' } };
    teamRepository.findOne.mockResolvedValue(team as Team);

    await expect(service.findOne(1)).resolves.toBe(team);
    expect(teamRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: { department: true },
    });
  });

  it('returns users belonging to the requested team', async () => {
    const team = { id: 2, name: 'Platform', department: { id: 3, name: 'IT' } };
    const users = [{ id: 'user-1', fullName: 'Alex Example' }];
    teamRepository.findOne.mockResolvedValue(team as Team);
    userRepository.find.mockResolvedValue(users as User[]);

    await expect(service.findUsers(2)).resolves.toBe(users);
    expect(teamRepository.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
      relations: { department: true },
    });
    expect(userRepository.find).toHaveBeenCalledWith({
      where: { team: { id: 2 } },
    });
  });

  it('returns projects belonging to the requested team', async () => {
    const team = { id: 2, name: 'Platform', department: { id: 3, name: 'IT' } };
    const projects = [{ id: 9, name: 'Website Redesign', teams: [team] }];
    teamRepository.findOne.mockResolvedValue(team as Team);
    projectRepository.find.mockResolvedValue(projects as Project[]);

    await expect(service.findProjects(2)).resolves.toBe(projects);
    expect(teamRepository.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
      relations: { department: true },
    });
    expect(projectRepository.find).toHaveBeenCalledWith({
      where: { teams: { id: 2 } },
      relations: { teams: true },
    });
  });
});
