import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';
import { Department } from '../departments/entities/department.entity';
import { Team } from '../teams/entities/team.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
  ) {}

  async createForRegistration(
    userData: Pick<User, 'fullName' | 'email' | 'passwordHash'>,
  ): Promise<User> {
    const user = this.usersRepository.create({
      ...userData,
      role: UserRole.MANAGING_DIRECTOR,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (!this.isManagingDirectorConstraintViolation(error)) {
        throw error;
      }

      // The unique generated-column index makes this safe even when multiple
      // first registrations race: only one save can claim the role.
      user.role = null;
      return this.usersRepository.save(user);
    }
  }

  async assignRole(
    userId: string,
    role: UserRole,
    assignerId: string,
    departmentId?: number,
    teamId?: number,
  ): Promise<Pick<User, 'id' | 'fullName' | 'email' | 'role'> & { departmentId: number | null; teamId: number | null }> {
    const assigner = await this.usersRepository.findOne({
      where: { id: assignerId },
      relations: { department: true },
    });
    if (!assigner) throw new NotFoundException('Assigning user not found');

    if (role === UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException(
        'The managing director role cannot be assigned to another user',
      );
    }

    let department: Department | null = null;
    let team: Team | null = null;
    if (role === UserRole.DEPARTMENT_HEAD) {
      if (assigner.role !== UserRole.MANAGING_DIRECTOR) {
        throw new BadRequestException(
          'Only the managing director can assign the department head role',
        );
      }
      if (teamId !== undefined) {
        throw new BadRequestException(
          'A team cannot be specified when assigning the department head role',
        );
      }
      if (departmentId === undefined) {
        throw new BadRequestException(
          'A department is required when assigning the department head role',
        );
      }
      department = await this.departmentsRepository.findOneBy({ id: departmentId });
      if (!department) throw new NotFoundException('Department not found');
    } else if (role === UserRole.TEAM_LEAD) {
      if (departmentId !== undefined) {
        throw new BadRequestException(
          'Specify a team, not a department, when assigning the team lead role',
        );
      }
      if (assigner.role !== UserRole.DEPARTMENT_HEAD) {
        throw new BadRequestException(
          'Only department heads can assign the team lead role',
        );
      }
      if (!assigner.department) {
        throw new BadRequestException(
          'The assigning department head has no department',
        );
      }
      if (teamId === undefined) {
        throw new BadRequestException(
          'A team is required when assigning the team lead role',
        );
      }
      team = await this.teamsRepository.findOne({
        where: { id: teamId },
        relations: { department: true },
      });
      if (!team) throw new NotFoundException('Team not found');
      if (!team.department) {
        throw new BadRequestException(
          'The selected team has no department assigned',
        );
      }
      if (team.department.id !== assigner.department.id) {
        throw new BadRequestException(
          'The selected team must belong to the department head\'s department',
        );
      }
      department = team.department;
    } else {
      if (departmentId !== undefined || teamId !== undefined) {
        throw new BadRequestException(
          'Department and team can only be set for department-based roles',
        );
      }
      if (assigner.role !== UserRole.MANAGING_DIRECTOR) {
        throw new BadRequestException(
          'Only the managing director can assign this role',
        );
      }
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException(
        'The managing director role cannot be changed through this endpoint',
      );
    }

    user.role = role;
    user.department = department;
    user.team = team;
    await this.usersRepository.save(user);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      departmentId: user.department?.id ?? null,
      teamId: user.team?.id ?? null,
    };
  }

  private isManagingDirectorConstraintViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError;
    if (typeof driverError !== 'object' || driverError === null) {
      return false;
    }

    const details = driverError as { code?: unknown; message?: unknown };
    return (
      details.code === 'ER_DUP_ENTRY' &&
      typeof details.message === 'string' &&
      details.message.includes('IDX_users_single_managing_director')
    );
  }
}
