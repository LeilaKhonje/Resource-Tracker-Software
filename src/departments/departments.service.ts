import { ConflictException, ForbiddenException, Injectable, NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-departments.dto';
import { User } from '../users/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { ResourceRequest } from '../resourcerequest/entities/resourcerequest.entity';
import { AuthTokenPayload } from '../auth/interfaces/auth-token-payload.interface';
import { UserRole } from '../users/user-role.enum';
import { EmailService } from '../email/email.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ResourceRequest)
    private readonly resourceRequestRepository: Repository<ResourceRequest>,
    private readonly email: EmailService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const department = this.departmentRepository.create({
      ...createDepartmentDto,
      description: createDepartmentDto.description ?? '',
    });
    try {
      return await this.departmentRepository.save(department);
    } catch (error) {
      if (this.isDepartmentNameConflict(error)) {
        throw new ConflictException('A department with this name already exists');
      }
      throw error;
    }
  }

  private isDepartmentNameConflict(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
      errno?: number;
      message?: string;
      sqlMessage?: string;
    };
    const isDuplicateKey =
      driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
    const errorDetails = `${driverError.message ?? ''} ${driverError.sqlMessage ?? ''}`;

    return isDuplicateKey && errorDetails.includes('UQ_department_name');
  }

  async findAll() {
    return this.departmentRepository.find();
  }

  async findOne(id: number) {
    const department = await this.departmentRepository.findOne({ where: { id } });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    return department;
  }

  async findUsers(id: number) {
    await this.findOne(id);
    return this.userRepository.find({ where: { department: { id } } });
  }

  async findTeams(id: number) {
    await this.findOne(id);
    return this.teamRepository.find({ where: { department: { id } } });
  }

  async findProjects(id: number) {
    await this.findOne(id);
    return this.projectRepository.find({
      where: { teams: { department: { id } } },
      relations: { teams: true },
    });
  }

  async findResourceRequests(id: number, user: AuthTokenPayload) {
    let departmentId = id;

    if (user.role === UserRole.DEPARTMENT_HEAD) {
      const account = await this.userRepository.findOne({
        where: { id: user.sub },
        relations: { department: true },
      });
      if (!account?.department) {
        throw new ForbiddenException('Your account is not assigned to a department');
      }
      if (account.department.id !== id) {
        throw new NotFoundException(`Department with id ${id} not found`);
      }
      departmentId = account.department.id;
    } else if (user.role === UserRole.MANAGING_DIRECTOR) {
      await this.findOne(id);
    } else {
      throw new ForbiddenException('Only department heads and managing directors can view department requests');
    }

    return this.resourceRequestRepository.find({
      where: { departmentId: String(departmentId) },
      order: { createdAt: 'DESC' },
    });
  }

  async findTeamProjects(departmentId: number, teamId: number) {
    await this.findOne(departmentId);
    const team = await this.teamRepository.findOne({
      where: { id: teamId, department: { id: departmentId } },
    });

    if (!team) {
      throw new NotFoundException(
        `Team with id ${teamId} not found in department ${departmentId}`,
      );
    }

    return this.projectRepository.find({
      where: { teams: { id: teamId } },
      relations: { teams: true },
    });
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.findOne(id);
    Object.assign(department, updateDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async remove(id: number) {
    const department = await this.findOne(id);
    await this.departmentRepository.remove(department);
    return department;
  }

  async assignDepartmentHead(departmentId: number, userId: string) {
    const department = await this.findOne(departmentId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new ForbiddenException(
        `User with id ${userId} is not a department head`,
      );
    }

    user.department = department;
    const saved = await this.userRepository.save(user);
    await this.email.send(user.email, 'Department assignment updated', `You have been assigned as head of the ${department.name} department.`);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
      department: saved.department,
    };
  }
}
