import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthSecurityModule } from './auth-security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    AuthSecurityModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
