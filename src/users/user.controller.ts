import { Body, Controller, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGING_DIRECTOR, UserRole.DEPARTMENT_HEAD)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/role')
  assignRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() assignUserRoleDto: AssignUserRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.assignRole(
      userId,
      assignUserRoleDto.role,
      request.user!.sub,
      assignUserRoleDto.departmentId,
      assignUserRoleDto.teamId,
    );
  }
}
