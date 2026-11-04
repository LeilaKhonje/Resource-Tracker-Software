import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    try {
      const user = await this.usersRepository.save(this.usersRepository.create({
        fullName: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
        email,
        passwordHash: await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS),
        role: null,
      }));
      return { user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof error.driverError === 'object' && error.driverError !== null &&
        'code' in error.driverError && error.driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async getMyProfile(userId: string){
    const user = await this .usersRepository.findOne({where: {id: userId},});
    
    if(!user){
      throw new NotFoundException('User Not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      preferredPronoun: user.preferredPronoun
    };
  }

  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one profile field to update');
    }
    if (dto.dateOfBirth && new Date(`${dto.dateOfBirth}T00:00:00Z`) > new Date()) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);
    await this.usersRepository.save(user);
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      preferredPronoun: user.preferredPronoun,
    };
  }

  async changeMyPassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPasswordMatches = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    user.passwordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      BCRYPT_ROUNDS,
    );
    await this.usersRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async deactivateMyAccount(userId: string){
    const user = await this.usersRepository.findOne({where: {id: userId},});
    if(!user){
      throw new NotFoundException('User Not Found');
    }

    if(!user.isActive){
      throw new BadRequestException('User already deactivated');
    }

    user.isActive = false;

    await this.usersRepository.save(user);

    return 'Your account has been deactivated successfully';
  }

  async reActivateMyAccount(userId: string){
    const user = await this.usersRepository.findOne({where: {id: userId},});

    if(!user){
      throw new NotFoundException('User not found')
    }

    if(user.isActive){
      throw new BadRequestException('account is already active');
    }
    
    user.isActive = true;

    await this.usersRepository.save(user);

    return 'Account successfully re-activated';
  }

  async assignRole(
    userId: string,
    role: UserRole,
    assignerId: string,
  ): Promise<Pick<User, 'id' | 'fullName' | 'email' | 'role'>> {
    const assigner = await this.usersRepository.findOneBy({ id: assignerId });
    if (!assigner) throw new NotFoundException('Assigning user not found');

    if (role === UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException(
        'The managing director role cannot be assigned to another user',
      );
    }

    if (role === UserRole.DEPARTMENT_HEAD && assigner.role !== UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException(
        'Only the managing director can assign the department head role',
      );
    }
    if (role === UserRole.TEAM_LEAD && assigner.role !== UserRole.DEPARTMENT_HEAD) {
      throw new BadRequestException(
        'Only department heads can assign the team lead role',
      );
    }
    if (role === UserRole.LINE_MANAGER && assigner.role !== UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException('Only the managing director can assign this role');
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

}
