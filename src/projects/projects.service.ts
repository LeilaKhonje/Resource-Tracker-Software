import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/user.entity';
import { userNameFields } from '../users/user-name.util';
import { UserRole } from '../users/user-role.enum';
import { AuthTokenPayload } from '../auth/interfaces/auth-token-payload.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { UpdateProjectDto } from './dto/update-project.dto';

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
    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new ForbiddenException('Only department heads can create projects');
    }
    const departmentId = await this.getDepartmentHeadDepartmentId(user);
    this.assertDateRange(createProjectDto.startDate, createProjectDto.endDate);
    const { teamIds = [], ...projectDetails } = createProjectDto;
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

  async findByDepartment(departmentId: number) {
    return this.projectRepository.find({
      where: { teams: { department: { id: departmentId } } },
      select: { id: true, name: true, description: true, startDate: true, endDate: true },
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

  async update(id: number, updateProjectDto: UpdateProjectDto, user: AuthTokenPayload) {
    if (
      updateProjectDto.name === undefined &&
      updateProjectDto.description === undefined &&
      updateProjectDto.startDate === undefined &&
      updateProjectDto.endDate === undefined
    ) {
      throw new BadRequestException('Provide at least one project field to update');
    }
    const project = await this.findOne(id, user);
    this.assertDateRange(
      updateProjectDto.startDate ?? project.startDate,
      updateProjectDto.endDate ?? project.endDate,
    );
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async findTeamMembers(id: number, user: AuthTokenPayload, teamId?: number) {
    const project = await this.findOne(id, user);
    const projectTeams = [...project.teams].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    const teams = teamId === undefined
      ? projectTeams
      : projectTeams.filter((team) => team.id === teamId);
    if (teamId !== undefined && teams.length === 0) {
      throw new NotFoundException(`Team ${teamId} is not assigned to project ${id}`);
    }
    if (teams.length === 0) {
      return { projectId: project.id, projectName: project.name, teams: [] };
    }

    const members = await this.users.find({
      where: { team: { id: In(teams.map((team) => team.id)) } },
      relations: { team: true },
      select: { id: true, fullName: true, firstName: true, middleName: true, surname: true, team: { id: true, name: true } },
      order: { team: { name: 'ASC' }, fullName: 'ASC' },
    });
    return {
      projectId: project.id,
      projectName: project.name,
      teams: teams.map((team) => ({
        teamId: team.id,
        teamName: team.name,
        members: members
          .filter((member) => member.team?.id === team.id)
          .map((member) => ({ id: member.id, ...userNameFields(member) })),
      })),
    };
  }

  async remove(id: number, user: AuthTokenPayload) {
    const project = await this.findOne(id, user);
    await this.projectRepository.remove(project);
    return { message: `Project with id ${id} deleted successfully` };
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

  private assertDateRange(startDate: string, endDate: string) {
    if (startDate > endDate) {
      throw new BadRequestException('Project endDate must be on or after startDate');
    }
  }

  private async findTeams(teamIds: number[]) {
    if (teamIds.length === 0) return [];

    const teams = await this.teamRepository.find({
      where: { id: In(teamIds) },
      relations: { department: true },
    });
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
