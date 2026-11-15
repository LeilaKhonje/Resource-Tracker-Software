import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { AuthSecurityModule } from './auth-security.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthSecurityModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
