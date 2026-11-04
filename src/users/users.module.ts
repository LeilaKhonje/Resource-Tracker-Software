import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { AuthSecurityModule } from '../auth/auth-security.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthSecurityModule],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
