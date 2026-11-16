import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthTokenPayload } from './interfaces/auth-token-payload.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOneBy({ email: forgotPasswordDto.email.trim().toLowerCase() });
    if (user?.isActive) {
      const code = String(randomInt(100000, 1000000));
      user.passwordResetCodeHash = this.hashResetCode(user.email, code);
      user.passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      user.passwordResetAttempts = 0;
      await this.usersRepository.save(user);
      await this.email.send(user.email, 'Your password reset code', `Your password reset code is ${code}. It expires in 10 minutes.`);
    }
    const email = forgotPasswordDto.email.trim().toLowerCase();
    return {
      message: ` A password reset code has been sent to ${this.maskEmail(email)}.`,
    };
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return 'your email address';

    const visiblePrefix = localPart.slice(0, 1);
    const visibleSuffix = localPart.length > 2 ? localPart.slice(-1) : '';
    const maskedLocalPart = `${visiblePrefix}${'*'.repeat(Math.max(1, localPart.length - visiblePrefix.length - visibleSuffix.length))}${visibleSuffix}`;
    return `${maskedLocalPart}@${domain}`;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.createQueryBuilder('user')
      .addSelect(['user.passwordResetCodeHash', 'user.passwordResetExpiresAt', 'user.passwordResetAttempts'])
      .where('user.email = :email', { email })
      .getOne();
    if (!user || !user.isActive || !user.passwordResetCodeHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() <= Date.now() || user.passwordResetAttempts >= 5) {
      throw new UnauthorizedException('Invalid or expired password reset code');
    }
    const expected = Buffer.from(user.passwordResetCodeHash, 'hex');
    const actual = Buffer.from(this.hashResetCode(email, dto.code), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      user.passwordResetAttempts += 1;
      if (user.passwordResetAttempts >= 5) {
        user.passwordResetCodeHash = null;
        user.passwordResetExpiresAt = null;
      }
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Invalid or expired password reset code');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    user.refreshTokenHash = null;
    user.passwordResetCodeHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordResetAttempts = 0;
    await this.usersRepository.save(user);
    return { message: 'Password reset successfully' };
  }

  private hashResetCode(email: string, code: string): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
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
