import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../departments/entities/department.entity';
import { User } from './user.entity';
import { Team } from '../teams/entities/team.entity';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { AuditLog } from '../auditlog/auditlog.entity';
import { EmailModule } from '../email/email.module';


@Module({
  imports: [TypeOrmModule.forFeature([User, Department, Team, AuditLog]), AuthSecurityModule, EmailModule],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
