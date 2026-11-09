import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { AuditLog } from '../auditlog/auditlog.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
  ) {}

  async createAccount(dto: CreateUserDto, adminId: string) {
    const email = dto.email.trim().toLowerCase();
    if (await this.usersRepository.findOneBy({ email })) {
      throw new ConflictException('An account with this email already exists');
    }
    if (dto.role === UserRole.MANAGING_DIRECTOR && await this.usersRepository.findOneBy({ role: UserRole.MANAGING_DIRECTOR })) {
      throw new ConflictException('A Managing Director is already assigned');
    }

    const user = await this.usersRepository.save(this.usersRepository.create({
      fullName: dto.fullName.trim(),
      email,
      role: dto.role,
      passwordHash: await bcrypt.hash(dto.initialPassword, BCRYPT_ROUNDS),
      isActive: true,
    }));
    await this.logAccountAction('ACCOUNT_CREATED', user.id, adminId, `Created active account for ${email} with role ${dto.role}`);
    return {
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive },
    };
  }

  async listUsers() {
    const users = await this.usersRepository.find({
      select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
      order: { fullName: 'ASC' },
    });
    return users;
  }

  private async logAccountAction(actionType: string, userId: string, actorId: string, details: string) {
    await this.auditLogsRepository.save(this.auditLogsRepository.create({
      actionType,
      entityType: 'user',
      details: JSON.stringify({ userId, actorId, details }),
      performedBy: actorId,
      note: details,
    }));
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
            department: user.department?.name,
            team: user.team?.name,
          
        }
      
      case UserRole.LINE_MANAGER:
        return{
          ...baseProfile,
      }

      case UserRole.DEPARTMENT_HEAD:
        return{
          ...baseProfile,
            department: user.department?.name,
          
        }
      
      case UserRole.MANAGING_DIRECTOR:
        return{
          ...baseProfile,
        }

      case UserRole.SYSTEM_ADMIN:
        return { ...baseProfile };

      case UserRole.TEAM_MEMBER:
        return{
          ...baseProfile,
            department: user.department?.name,
            team: user.team?.name,
          
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

  async deactivateUser(userId: string, adminId: string){
    await this.assertSystemAdmin(adminId);
    if (userId === adminId) {
      throw new BadRequestException('The System Admin cannot deactivate their own account');
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
    await this.logAccountAction('ACCOUNT_DEACTIVATED', user.id, adminId, 'Account deactivated');

    return 'User account deactivated successfully';
  }

  async reactivateUser(userId: string, adminId: string){
    await this.assertSystemAdmin(adminId);
    const user = await this.usersRepository.findOne({where: {id: userId},});

    if(!user){
      throw new NotFoundException('User not found')
    }

    if(user.isActive){
      throw new BadRequestException('account is already active');
    }
    
    user.isActive = true;

    await this.usersRepository.save(user);
    await this.logAccountAction('ACCOUNT_REACTIVATED', user.id, adminId, 'Account reactivated');

    return 'Account successfully re-activated';
  }

  private async assertSystemAdmin(userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('System Admin not found');
    if (user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only the System Admin can manage user accounts');
    }
  }

  async assignRole(
    userId: string,
    role: UserRole,
    assignerId: string,
  ): Promise<Pick<User, 'id' | 'fullName' | 'role'>> {
    const assigner = await this.usersRepository.findOneBy({ id: assignerId });
    if (!assigner) throw new NotFoundException('Assigning user not found');

    const isSystemAdmin = assigner.role === UserRole.SYSTEM_ADMIN;
    if (role === UserRole.SYSTEM_ADMIN) {
      throw new BadRequestException(
        'The system admin role can only be assigned through the bootstrap process',
      );
    }

    if (role === UserRole.DEPARTMENT_HEAD && !isSystemAdmin && assigner.role !== UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException(
        'Only the managing director can assign the department head role',
      );
    }
    if (role === UserRole.TEAM_LEAD && !isSystemAdmin && assigner.role !== UserRole.DEPARTMENT_HEAD) {
      throw new BadRequestException(
        'Only department heads can assign the team lead role',
      );
    }
    if (role === UserRole.LINE_MANAGER && !isSystemAdmin && assigner.role !== UserRole.MANAGING_DIRECTOR) {
      throw new BadRequestException('Only the managing director can assign this role');
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (role === UserRole.MANAGING_DIRECTOR) {
      const existingManagingDirector = await this.usersRepository.findOneBy({
        role: UserRole.MANAGING_DIRECTOR,
      });
      if (existingManagingDirector && existingManagingDirector.id !== user.id) {
        throw new ConflictException('A Managing Director is already assigned');
      }
    }
    if (user.role === UserRole.MANAGING_DIRECTOR && !isSystemAdmin) {
      throw new BadRequestException(
        'Only the System Admin can change the Managing Director role',
      );
    }

    user.role = role;
    await this.usersRepository.save(user);
    await this.logAccountAction('ROLE_ASSIGNED', user.id, assignerId, `Assigned role ${role}`);

    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    };
  }

}
