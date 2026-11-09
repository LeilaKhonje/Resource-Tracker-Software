import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthTokenPayload } from './interfaces/auth-token-payload.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

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

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    return this.loginUser(user);
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { user, token } = await this.getRefreshTokenUser(refreshTokenDto.refreshToken);
    if (!user.refreshTokenHash || user.refreshTokenHash !== this.hashToken(token)) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.loginUser(user);
  }

  async logout(logoutDto: LogoutDto) {
    const { user, token } = await this.getRefreshTokenUser(logoutDto.refreshToken);
    if (!user.refreshTokenHash || user.refreshTokenHash !== this.hashToken(token)) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    user.refreshTokenHash = null;
    await this.usersRepository.save(user);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(_forgotPasswordDto: ForgotPasswordDto) {
    // Keep the response independent of whether the email belongs to an account.
    // Password reset delivery can be connected here when an email provider is configured.
    return {
      message:
        'If an account exists for this email, password reset instructions will be sent.',
    };
  }

  private async loginUser(user: User){
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        { ...payload, tokenUse: 'refresh' },
        { expiresIn: REFRESH_TOKEN_TTL },
      ),
    ]);

    user.refreshTokenHash = this.hashToken(refreshToken);
    await this.usersRepository.save(user);

    return { accessToken, refreshToken };
  }

  private async getRefreshTokenUser(refreshToken: string) {
    let payload: AuthTokenPayload & { tokenUse?: string };
    try {
      payload = await this.jwtService.verifyAsync<
        AuthTokenPayload & { tokenUse?: string }
      >(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      payload.tokenUse !== 'refresh' ||
      typeof payload.sub !== 'string'
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, refreshTokenHash: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return { user, token: refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async verifyPassword(password: string, passwordHash: string,): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
