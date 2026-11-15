import { Body, Controller, Param, ParseUUIDPipe, Patch, Req, UseGuards, Get, UsePipes, ValidationPipe, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('api/v1/users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Post('')
  @ApiOperation({ summary: 'Create a user account with an initial password (System Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Active account created; the initial password is not returned' })
  @ApiResponse({ status: 400, description: 'Invalid account details' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already exists' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth('access-token')
  createAccount(@Body() createUserDto: CreateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.createAccount(createUserDto, request.user!.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List user accounts (System Admin and managing directors)' })
  @ApiResponse({ status: 200, description: 'User accounts without credential data' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGING_DIRECTOR)
  @ApiBearerAuth('access-token')
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get('line-managers')
  @ApiOperation({ summary: 'List active Line Managers for request routing' })
  @ApiResponse({
    status: 200,
    description: 'Active Line Managers available to receive resource requests',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEAM_LEAD)
  @ApiBearerAuth('access-token')
  listActiveLineManagers() {
    return this.usersService.listActiveLineManagers();
  }

@Patch(':id/role')
@ApiOperation({ summary: 'Update a user role' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiBody({ type: AssignUserRoleDto })
@ApiResponse({ status: 200, description: 'User assignment updated', schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: Object.values(UserRole).filter((role) => role !== UserRole.SYSTEM_ADMIN) } } } })
@ApiResponse({ status: 401, description: 'Authentication required' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@ApiResponse({ status: 400, description: 'Invalid role value or role assignment is not permitted' })
@ApiResponse({ status: 404, description: 'Target user or assigning user not found' })
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGING_DIRECTOR, UserRole.DEPARTMENT_HEAD)
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
@ApiResponse({ status: 200, description: 'User profile', schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', nullable: true, enum: Object.values(UserRole) }, department: { type: 'string', nullable: true }, team: { type: 'string', nullable: true } } } })
@ApiResponse({ status: 401, description: 'Authentication required' })
@ApiResponse({ status: 404, description: 'User not found' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
 async getMyProfile(@Req() req: AuthenticatedRequest){
   const userId = req.user!.sub;

   return this.usersService.getMyProfile(userId)
 }

 @Patch('me/profile')
 @ApiOperation({ summary: 'Update the authenticated user profile details' })
 @ApiBody({ type: UpdateMyProfileDto })
 @ApiResponse({ status: 200, description: 'Updated user profile details' })
 @ApiResponse({ status: 400, description: 'Invalid profile details or no fields supplied' })
 @ApiResponse({ status: 401, description: 'Authentication required' })
 @ApiResponse({ status: 404, description: 'User not found' })
 @UseGuards(JwtAuthGuard)
 @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
 @ApiBearerAuth('access-token')
 updateMyProfile(
   @Req() req: AuthenticatedRequest,
   @Body() updateMyProfileDto: UpdateMyProfileDto,
 ) {
   return this.usersService.updateMyProfile(req.user!.sub, updateMyProfileDto);
 }

 @Patch('me/password')
 @ApiOperation({ summary: 'Change the authenticated user password' })
 @ApiBody({ type: ChangePasswordDto })
 @ApiResponse({ status: 200, description: 'Password changed successfully' })
 @ApiResponse({ status: 400, description: 'Invalid new password or new password matches the current password' })
 @ApiResponse({ status: 401, description: 'Authentication required or current password is incorrect' })
 @ApiResponse({ status: 404, description: 'User not found' })
 @UseGuards(JwtAuthGuard)
 @ApiBearerAuth('access-token')
 changeMyPassword(
   @Req() req: AuthenticatedRequest,
   @Body() changePasswordDto: ChangePasswordDto,
 ) {
   return this.usersService.changeMyPassword(req.user!.sub, changePasswordDto);
 }

 @Patch(':id/deactivate')
 @ApiOperation({ summary: 'Deactivate a user account (System Admin only)' })
 @ApiParam({ name: 'id', description: 'User UUID' })
 @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
 @ApiResponse({ status: 400, description: 'Account is already deactivated or the System Admin cannot deactivate their own account' })
 @ApiResponse({ status: 401, description: 'Authentication required' })
 @ApiResponse({ status: 403, description: 'Only the System Admin can deactivate user accounts' })
 @ApiResponse({ status: 404, description: 'User not found' })
 @UseGuards(JwtAuthGuard, RolesGuard)
 @Roles(UserRole.SYSTEM_ADMIN)
 @ApiBearerAuth('access-token')
 deactivateUser(@Param('id', ParseUUIDPipe) userId: string, @Req() req: AuthenticatedRequest) {
  return this.usersService.deactivateUser(userId, req.user!.sub);
 }

 @Patch(':id/reactivate')
 @ApiOperation({ summary: 'Reactivate a user account (System Admin only)' })
 @ApiParam({ name: 'id', description: 'User UUID' })
 @ApiResponse({ status: 200, description: 'Account reactivated successfully' })
 @ApiResponse({ status: 400, description: 'Account is already active' })
 @ApiResponse({ status: 401, description: 'Authentication required' })
 @ApiResponse({ status: 403, description: 'Only the System Admin can reactivate user accounts' })
 @ApiResponse({ status: 404, description: 'User not found' })
 @UseGuards(JwtAuthGuard, RolesGuard)
 @Roles(UserRole.SYSTEM_ADMIN)
 @ApiBearerAuth('access-token')
 reactivateUser(@Param('id', ParseUUIDPipe) userId: string, @Req() req: AuthenticatedRequest) {
  return this.usersService.reactivateUser(userId, req.user!.sub);
 }

}
