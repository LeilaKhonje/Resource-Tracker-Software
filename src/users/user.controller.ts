import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGING_DIRECTOR)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/role')
  assignRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() assignUserRoleDto: AssignUserRoleDto,
  ) {
    return this.usersService.assignRole(userId, assignUserRoleDto.role);
  }
}
