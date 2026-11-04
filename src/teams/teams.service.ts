import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { AuthTokenPayload } from '../auth/interfaces/auth-token-payload.interface';
import { UserRole } from '../users/user-role.enum';
import { AssignTeamLeadDto } from './dto/assign-team-lead.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ResourceRequest)
    private readonly resourceRequestRepository: Repository<ResourceRequest>,
  ) {}

  async create(createTeamDto: CreateTeamDto) {
    const { departmentId, ...teamData } = createTeamDto;
    const department = await this.departmentRepository.findOneBy({ id: departmentId });
    if (!department) throw new NotFoundException(`Department with id ${departmentId} not found`);
    const team = this.teamRepository.create({ ...teamData, department });
    return this.teamRepository.save(team);
  }

  async findAll() {
    return this.teamRepository.find({ relations: { department: true } });
  }

  async findOne(id: number) {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: { department: true },
    });

    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }

    return team;
  }

  async assignTeamLead(id: number, dto: AssignTeamLeadDto, user: AuthTokenPayload) {
    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new ForbiddenException('Only the department head can assign a team lead');
    }

    const team = await this.findOne(id);
    if (!team.department) {
      throw new ForbiddenException('This team is not assigned to a department');
    }

    const departmentHead = await this.userRepository.findOne({
      where: { id: user.sub },
      relations: { department: true },
    });
    if (departmentHead?.department?.id !== team.department.id) {
      throw new ForbiddenException('Only the department head of this team\'s department can assign its team lead');
    }

    const teamLead = await this.userRepository.findOneBy({ id: dto.userId });
    if (!teamLead) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }
    if (teamLead.role !== UserRole.TEAM_LEAD) {
      throw new ForbiddenException('The assigned user must have the team lead role');
    }

    teamLead.team = team;
    teamLead.department = team.department;
    await this.userRepository.save(teamLead);
    return this.findOne(id);
  }

  async findUsers(id: number) {
    await this.findOne(id);
    return this.userRepository.find({ where: { team: { id } } });
  }

  async findProjects(id: number) {
    await this.findOne(id);
    return this.projectRepository.find({
      where: { teams: { id } },
      relations: { teams: true },
    });
  }

  async findResourceRequests(id: number, user: AuthTokenPayload) {
    if (
      user.role !== UserRole.TEAM_LEAD &&
      user.role !== UserRole.TEAM_MEMBER
    ) {
      throw new ForbiddenException('Only team members can view team requests');
    }

    await this.findOne(id);
    const account = await this.userRepository.findOne({
      where: { id: user.sub },
      relations: { team: true },
    });
    if (!account?.team) {
      throw new ForbiddenException('Your account is not assigned to a team');
    }
    if (account.team.id !== id) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }

    return this.resourceRequestRepository.find({
      where: { teamId: String(id) },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const team = await this.findOne(id);
    const { departmentId, ...teamData } = updateTeamDto;
    Object.assign(team, teamData);
    if (departmentId !== undefined) {
      const department = await this.departmentRepository.findOneBy({ id: departmentId });
      if (!department) throw new NotFoundException(`Department with id ${departmentId} not found`);
      team.department = department;
    }
    return this.teamRepository.save(team);
  }

  async remove(id: number) {
    const team = await this.findOne(id);
    await this.teamRepository.remove(team);
    return team;
  }
}
