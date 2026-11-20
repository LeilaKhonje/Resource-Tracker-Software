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
import { ListUsersDto } from './dto/list-users.dto';
import { ManageUserDto, UserManagementAction } from './dto/manage-user.dto';
import { ManageMyAccountDto, MyAccountAction } from './dto/manage-my-account.dto';
import { EmailService } from '../email/email.service';
import { randomInt } from 'node:crypto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
    private readonly email: EmailService,
  ) {}

  async createAccount(dto: CreateUserDto, adminId: string) {
    const email = dto.email.trim().toLowerCase();
    const role = dto.role;
    const fullName = [dto.firstName, dto.middleName, dto.surname]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(' ');
    if (fullName.length > 120) {
      throw new BadRequestException('Combined name must be 120 characters or fewer');
    }
    if (await this.usersRepository.findOneBy({ email })) {
      throw new ConflictException('An account with this email already exists');
    }
    if (dto.role === UserRole.MANAGING_DIRECTOR && await this.usersRepository.findOneBy({ role: UserRole.MANAGING_DIRECTOR })) {
      throw new ConflictException('A Managing Director is already assigned');
    }

    const temporaryPassword = this.createTemporaryPassword();
    const user = await this.usersRepository.save(this.usersRepository.create({
      fullName,
      email,
      role: dto.role,
      passwordHash: await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS),
      mustChangePassword: true,
      isActive: true,
    }));

    try {
      await this.email.sendRequired(
        email,
        'Your Resource Tracker account',
        `Hello ${fullName},\n\nYour Resource Tracker account has been created.\n\nName: ${fullName}\nSign-in email: ${email}\n Role: ${role}\nTemporary password: ${temporaryPassword}\n\nSign in using the email address above and this temporary password. Change the password immediately when prompted.`,
      );
    } catch (error) {
      await this.usersRepository.delete({ id: user.id });
      throw error;
    }

    await this.logAccountAction('ACCOUNT_CREATED', user.id, adminId, `Created active account for ${email} with role ${dto.role}`);
    return {
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive },
    };
  }

  private createTemporaryPassword(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const password = Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]);
    if (!/\d/.test(password.join(''))) {
      password[randomInt(password.length)] = '23456789'[randomInt(8)];
    }
    return password.join('');
  }

  async listUsers(filter: ListUsersDto) {
    const hasStartDate = filter.startDate !== undefined;
    const hasEndDate = filter.endDate !== undefined;
    if (hasStartDate !== hasEndDate) {
      throw new BadRequestException('startDate and endDate must be supplied together');
    }

    if (!hasStartDate) {
      return this.usersRepository.find({
        select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
        order: { fullName: 'ASC' },
      });
    }

    const startDate = new Date(filter.startDate!);
    const endDate = new Date(filter.endDate!);
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    return this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
      ])
      .where('user.createdAt >= :startDate', { startDate })
      .andWhere('user.createdAt <= :endDate', { endDate })
      .orderBy('user.createdAt', 'ASC')
      .addOrderBy('user.fullName', 'ASC')
      .getMany();
  }

  async requestAccountDeletion(userId: string, password: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user) throw new NotFoundException('User not found');
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Password is incorrect');
    }
    user.deletionRequestedAt = new Date();
    user.refreshTokenHash = null;
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
    return { message: 'Account deletion scheduled in five days; log in before then to cancel it' };
  }

  async listActiveLineManagers() {
    return this.usersRepository.find({
      where: { role: UserRole.LINE_MANAGER, isActive: true },
      select: { id: true, fullName: true, email: true },
      order: { fullName: 'ASC' },
    });
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
            teamId: user.team ? String(user.team.id) : null,
          
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

  async manageMyAccount(userId: string, dto: ManageMyAccountDto) {
    const profileFields = ['phoneNumber', 'address', 'dateOfBirth', 'preferredPronoun'] as const;
    const passwordFields = ['currentPassword', 'newPassword'] as const;
    const suppliedProfileFields = profileFields.filter((field) => dto[field] !== undefined);
    const suppliedPasswordFields = passwordFields.filter((field) => dto[field] !== undefined);

    if (dto.action === MyAccountAction.UPDATE_PROFILE) {
      if (suppliedProfileFields.length === 0 || suppliedPasswordFields.length > 0) {
        throw new BadRequestException('Provide one or more profile fields only for update_profile');
      }
      return this.updateMyProfile(userId, {
        phoneNumber: dto.phoneNumber,
        address: dto.address,
        dateOfBirth: dto.dateOfBirth,
        preferredPronoun: dto.preferredPronoun,
      });
    }

    if (
      dto.action !== MyAccountAction.CHANGE_PASSWORD ||
      suppliedProfileFields.length > 0 ||
      suppliedPasswordFields.length !== passwordFields.length
    ) {
      throw new BadRequestException('Provide currentPassword and newPassword only for change_password');
    }

    return this.changeMyPassword(userId, {
      currentPassword: dto.currentPassword!,
      newPassword: dto.newPassword!,
    });
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
    user.mustChangePassword = false;
    await this.usersRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async deactivateUser(userId: string, adminId: string){
    await this.assertSystemAdmin(adminId);
    if (userId === adminId) {
      throw new BadRequestException('The System Admin cannot deactivate their own account');
    }
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :userId', { userId })
      .getOne();
    if(!user){
      throw new NotFoundException('User Not Found');
    }

    if(!user.isActive){
      throw new BadRequestException('User already deactivated');
    }

    user.isActive = false;
    user.refreshTokenHash = null;
    user.tokenVersion += 1;

    await this.usersRepository.save(user);
    await this.logAccountAction('ACCOUNT_DEACTIVATED', user.id, adminId, 'Account deactivated');

    return 'User account deactivated successfully';
  }

  async manageUser(userId: string, dto: ManageUserDto, actorId: string) {
    switch (dto.action) {
      case UserManagementAction.DEACTIVATE:
        if (dto.role !== undefined) {
          throw new BadRequestException('role can only be provided when action is assign_role');
        }
        return this.deactivateUser(userId, actorId);
      case UserManagementAction.REACTIVATE:
        if (dto.role !== undefined) {
          throw new BadRequestException('role can only be provided when action is assign_role');
        }
        return this.reactivateUser(userId, actorId);
      case UserManagementAction.ASSIGN_ROLE:
        if (!dto.role) {
          throw new BadRequestException('role is required when action is assign_role');
        }
        return this.assignRole(userId, dto.role, actorId);
      default:
        throw new BadRequestException('Unsupported account action');
    }
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
