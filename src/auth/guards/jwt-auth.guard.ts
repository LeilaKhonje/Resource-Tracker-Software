import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../users/user-role.enum';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthTokenPayload } from '../interfaces/auth-token-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const parts = authorization?.split(' ') ?? [];
    const [scheme, token] = parts;

    if (parts.length !== 2 || scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('A bearer access token is required');
    }

    let payload: AuthTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
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
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.role !== null &&
        !Object.values(UserRole).includes(payload.role))
    ) {
      throw new UnauthorizedException('The access token is invalid');
    }

    request.user = payload;
    return true;
  }
}
