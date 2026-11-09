import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../users/user-role.enum';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthTokenPayload } from '../interfaces/auth-token-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const parts = authorization?.split(' ') ?? [];
    const [scheme, token] = parts;

    if (parts.length !== 2 || scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('A bearer access token is required');
    }

    let payload: AuthTokenPayload & { tokenUse?: string };
    try {
      payload = await this.jwtService.verifyAsync<
        AuthTokenPayload & { tokenUse?: string }
      >(token);
    } catch (error) {
      if (
        error instanceof Error &&
        ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(
          error.name,
        )
      ) {
        throw new UnauthorizedException('The access token is invalid or expired');
      }
      throw error;
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      payload.tokenUse === 'refresh' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.role !== null &&
        !Object.values(UserRole).includes(payload.role))
    ) {
      throw new UnauthorizedException('The access token is invalid');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('The account is inactive or no longer exists');
    }

    request.user = { ...payload, email: user.email, role: user.role };
    return true;
  }
}
