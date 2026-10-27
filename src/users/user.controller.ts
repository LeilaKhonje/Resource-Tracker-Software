import { Body, Controller, Param, ParseUUIDPipe, Patch, Req, UseGuards, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

@Patch(':id/role')
@ApiOperation({ summary: 'Update a user role' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiBody({ type: AssignUserRoleDto })
@ApiResponse({ status: 200, description: 'User assignment updated' })
@ApiResponse({ status: 401, description: 'Authentication required' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Roles(UserRole.MANAGING_DIRECTOR, UserRole.DEPARTMENT_HEAD)
@ApiBearerAuth('access-token')
assignRole(
  @Param('id', ParseUUIDPipe) userId: string,
  @Body() assignUserRoleDto: AssignUserRoleDto,
  @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.assignRole(
      userId,
      assignUserRoleDto.role,
      request.user!.sub,
    );
  }

@Get('me')
@ApiOperation({ summary: 'User must view his profile' })
@ApiResponse({ status: 200, description: 'Users retrieved successfully' })
@ApiResponse({ status: 401, description: 'Authentication required' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
 async getMyProfile(@Req() req: AuthenticatedRequest){
   const userId = req.user!.sub;

   return this.usersService.getMyProfile(userId)
 }

}
