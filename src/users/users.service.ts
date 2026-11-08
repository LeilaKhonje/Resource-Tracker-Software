import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const user = await this.usersRepository.save(this.usersRepository.create({
        fullName: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
        passwordHash: await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS),
        email: registerDto.email,
        role: null,
      }));
    return { user: { id: user.id, fullName: user.fullName, role: user.role } };
  }

  async getMyProfile(userId: string){
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { department: true, team: true },
    });
    
    if(!user){
      throw new NotFoundException('User Not found');
    }

    const baseProfile ={
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      preferredPronoun: user.preferredPronoun,
    }

    switch(user.role){
      case UserRole.TEAM_LEAD:
        return{
          ...baseProfile,
          profile:{
            department: user.department?.name,
            team: user.team?.name,
          }
        }
      
      case UserRole.LINE_MANAGER:
        return{
          ...baseProfile,
      }

      case UserRole.DEPARTMENT_HEAD:
        return{
          ...baseProfile,
          profile:{
            department: user.department?.name,
          }
        }
      
      case UserRole.MANAGING_DIRECTOR:
        return{
          ...baseProfile,
        }

      case UserRole.TEAM_MEMBER:
        return{
          ...baseProfile,
          profile:{
            department: user.department?.name,
            team: user.team?.name,
          }
        }

    
    }

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

  async deactivateUser(userId: string, managingDirectorId: string){
    await this.assertManagingDirector(managingDirectorId);
    if (userId === managingDirectorId) {
      throw new BadRequestException('The Managing Director cannot deactivate their own account');
    }
    const user = await this.usersRepository.findOne({where: {id: userId},});
    if(!user){
      throw new NotFoundException('User Not Found');
    }

    if(!user.isActive){
      throw new BadRequestException('User already deactivated');
    }

    user.isActive = false;

    await this.usersRepository.save(user);

    return 'User account deactivated successfully';
  }

  async reactivateUser(userId: string, managingDirectorId: string){
    await this.assertManagingDirector(managingDirectorId);
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

  private async assertManagingDirector(userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Managing Director not found');
    if (user.role !== UserRole.MANAGING_DIRECTOR) {
      throw new ForbiddenException('Only the Managing Director can manage user account status');
    }
  }

  async assignRole(
    userId: string,
    role: UserRole,
    assignerId: string,
  ): Promise<Pick<User, 'id' | 'fullName' | 'role'>> {
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
      role: user.role,
    };
  }

}
