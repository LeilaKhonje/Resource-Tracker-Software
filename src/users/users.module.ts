import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../departments/entities/department.entity';
import { User } from './user.entity';
import { Team } from '../teams/entities/team.entity';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { AuthSecurityModule } from '../auth/auth-security.module';


@Module({
  imports: [TypeOrmModule.forFeature([User, Department, Team]), AuthSecurityModule,],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
