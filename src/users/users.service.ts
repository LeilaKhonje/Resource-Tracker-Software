import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getMyProfile(userId: string){
    const user = await this .usersRepository.findOne({where: {id: userId},});
    
    if(!user){
      throw new NotFoundException('User Not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
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

  async createForRegistration(
    userData: Pick<User, 'fullName' | 'email' | 'passwordHash'>,): Promise<User> {const user = this.usersRepository.create({...userData, role: null, });
    return this.usersRepository.save(user);
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
