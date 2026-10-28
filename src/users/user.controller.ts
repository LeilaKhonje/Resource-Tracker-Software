import { Body, Controller, Param, ParseUUIDPipe, Patch, Req, UseGuards, Get, UsePipes, ValidationPipe, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid fields, email format, company email domain, or password requirements' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already exists' })
  register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.register(registerDto);
  }

@Patch(':id/role')
@ApiOperation({ summary: 'Update a user role' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiBody({ type: AssignUserRoleDto })
@ApiResponse({ status: 200, description: 'User assignment updated', schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: Object.values(UserRole) } } } })
@ApiResponse({ status: 401, description: 'Authentication required' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@ApiResponse({ status: 400, description: 'Invalid role value or role assignment is not permitted' })
@ApiResponse({ status: 404, description: 'Target user or assigning user not found' })
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
@ApiResponse({ status: 200, description: 'User profile', schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', nullable: true, enum: Object.values(UserRole) } } } })
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

 @ApiOperation({summary: 'A user can be able to de-activate their account'})
 @Patch('me/deactivate')
 @ApiOperation({ summary: 'Deactivate the authenticated user account' })
 @ApiResponse({ status: 200, description: 'Success message', schema: { type: 'string', example: 'Your account has been deactivated successfully' } })
 @ApiResponse({ status: 401, description: 'Authentication required' })
 @ApiResponse({ status: 400, description: 'Account is already deactivated' })
 @ApiResponse({ status: 404, description: 'User not found' })
 @UseGuards(JwtAuthGuard)
 @ApiBearerAuth('access-token')
 async deactivateMyAccount(@Req() req: AuthenticatedRequest){
  const userId = req.user!.sub;

  return this.usersService.deactivateMyAccount(userId);
 }

 @ApiOperation({summary: 'A user can be able to re-activate their account'})
 @Patch('me/reactivate')
 @ApiOperation({ summary: 'Reactivate the authenticated user account' })
 @ApiResponse({ status: 200, description: 'Success message', schema: { type: 'string', example: 'Account successfully re-activated' } })
 @ApiResponse({ status: 401, description: 'Authentication required' })
 @ApiResponse({ status: 400, description: 'Account is already active' })
 @ApiResponse({ status: 404, description: 'User not found' })
 @UseGuards(JwtAuthGuard)
 @ApiBearerAuth('access-token')
 async reActivateMyAccount(@Req() req: AuthenticatedRequest){
  const userId = req.user!.sub;

  return this.usersService.reActivateMyAccount(userId);
 }

}
