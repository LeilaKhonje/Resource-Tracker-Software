import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

  async assignRole(userId: string, role: UserRole): Promise<Pick<User, 'id' | 'fullName' | 'email' | 'role'>> {
    if (role === UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException(
        'The managing director role cannot be assigned to another user',
      );
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
    await this.usersRepository.save(user);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
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
