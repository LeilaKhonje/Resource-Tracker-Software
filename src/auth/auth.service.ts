import {ConflictException, Injectable, UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthTokenPayload } from './interfaces/auth-token-payload.interface';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    try {
      const user = await this.usersService.createForRegistration({
        fullName: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
        email,
        passwordHash: await this.hashPassword(registerDto.password),
      });
      return this.createAuthResponse(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof error.driverError === 'object' &&
        error.driverError !== null &&
        'code' in error.driverError &&
        error.driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }

  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      await bcrypt.hash(loginDto.password, BCRYPT_ROUNDS);
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.verifyPassword(loginDto.password, user.passwordHash,);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: User) {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {accessToken,user: {id: user.id, fullName: user.fullName, email: user.email, role: user.role,},
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private async verifyPassword(password: string, passwordHash: string,): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
