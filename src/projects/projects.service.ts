import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { AuthTokenPayload } from '../auth/interfaces/auth-token-payload.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: AuthTokenPayload) {
    const departmentId = await this.getDepartmentHeadDepartmentId(user);
    const { teamIds = [], ...projectDetails } = createProjectDto;
    if (teamIds.length === 0) {
      throw new UnprocessableEntityException('A project must be assigned to a team in your department');
    }
    const teams = await this.findTeams(teamIds);
    this.assertTeamsInDepartment(teams, departmentId);
    const project = this.projectRepository.create({
      ...projectDetails,
      teams,
    });
    return this.projectRepository.save(project);
  }

  async findAll(user: AuthTokenPayload) {
    if (user.role === UserRole.MANAGING_DIRECTOR) {
      return this.projectRepository.find({
        relations: { teams: { department: true } },
      });
    }
    const departmentId = await this.getDepartmentHeadDepartmentId(user);
    return this.projectRepository.find({
      where: { teams: { department: { id: departmentId } } },
      relations: { teams: { department: true } },
    });
  }

  async findOne(id: number, user: AuthTokenPayload) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { teams: { department: true } },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    if (user.role !== UserRole.MANAGING_DIRECTOR) {
      const departmentId = await this.getDepartmentHeadDepartmentId(user);
      if (!project.teams.some((team) => team.department?.id === departmentId)) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }
    }
    return project;
  }

  async assignTeams(id: number, teamIds: number[], user: AuthTokenPayload) {
    const departmentId = await this.getDepartmentHeadDepartmentId(user);
    const project = await this.findOne(id, user);
    const teams = await this.findTeams(teamIds);
    this.assertTeamsInDepartment(teams, departmentId);
    if (teams.length === 0) {
      throw new UnprocessableEntityException('A project must remain assigned to a team in your department');
    }
    project.teams = teams;
    return this.projectRepository.save(project);
  }

  private async getDepartmentHeadDepartmentId(user: AuthTokenPayload): Promise<number> {
    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new ForbiddenException('Only department heads can create or manage projects');
    }
    const account = await this.users.findOne({
      where: { id: user.sub },
      relations: { department: true },
    });
    if (!account?.department) {
      throw new ForbiddenException('Your account is not assigned to a department');
    }
    return account.department.id;
  }

  private assertTeamsInDepartment(teams: Team[], departmentId: number) {
    const invalidTeams = teams.filter((team) => team.department?.id !== departmentId);
    if (invalidTeams.length > 0) {
      throw new ForbiddenException('Projects can only be assigned to teams in your department');
    }
  }

  private async findTeams(teamIds: number[]) {
    if (teamIds.length === 0) return [];

    const teams = await this.teamRepository.find({ where: { id: In(teamIds) } });
    if (teams.length !== teamIds.length) {
      const foundIds = new Set(teams.map((team) => team.id));
      const missingIds = teamIds.filter((id) => !foundIds.has(id));
      throw new UnprocessableEntityException(
        `Team ids not found: ${missingIds.join(', ')}`,
      );
    }
    return teams;
  }
}
