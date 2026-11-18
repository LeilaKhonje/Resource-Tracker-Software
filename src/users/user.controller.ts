import { BadRequestException, Body, Controller, Param, ParseUUIDPipe, Patch, Req, UseGuards, Get, UsePipes, ValidationPipe, Post, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { ManageUserDto, UserManagementAction } from './dto/manage-user.dto';
import { ManageMyAccountDto, MyAccountAction } from './dto/manage-my-account.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '../common/swagger-response.decorators';

@Controller('api/v1/users')
@ApiTags('Users')
@ApiStandardErrorResponses(500)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Post('')
  @ApiOperation({ summary: 'Create a user account and assign a role to the user(System Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Active account created; the initial password is not returned', schema: { type: 'object', properties: { user: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: Object.values(UserRole) }, isActive: { type: 'boolean' } } } } } })
  @ApiResponse({ status: 400, description: 'Invalid account details' })
  @ApiResponse({ status: 401, description: 'Authentication is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Only System Admins can create user accounts.' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already exists' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth('access-token')
  createAccount(@Body() createUserDto: CreateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.createAccount(createUserDto, request.user!.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List user accounts, optionally filtered by creation date range (System Admin and managing directors)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date-time', example: '2026-11-01T00:00:00.000Z' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date-time', example: '2026-11-11T23:59:59.999Z' })
  @ApiResponse({ status: 200, description: 'User accounts without credential data', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: Object.values(UserRole) }, isActive: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } } } })
  @ApiResponse({ status: 400, description: 'Both dates must be supplied as valid timestamps, and startDate must not be after endDate' })
  @ApiResponse({ status: 401, description: 'Authentication is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Only System Admins and Managing Directors can list users.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGING_DIRECTOR)
  @ApiBearerAuth('access-token')
  listUsers(@Query() filter: ListUsersDto) {
    return this.usersService.listUsers(filter);
  }

  @Get('line-managers')
  @ApiOperation({ summary: 'List active Line Managers for request routing (Team leads only)' })
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
  @ApiResponse({ status: 401, description: 'Authentication is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Only Team Leads can list active Line Managers.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEAM_LEAD)
  @ApiBearerAuth('access-token')
  listActiveLineManagers() {
    return this.usersService.listActiveLineManagers();
  }

@Patch('me')
@ApiOperation({ summary: 'Update profile or change password (one action per request)',
  description: 'Only two types of actions are allowed: Update profile and change password, they are done one at a time'
})
@ApiBody({ type: ManageMyAccountDto })
@ApiResponse({ status: 200, description: 'Requested profile or password action completed.', schema: { oneOf: [{ type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, role: { type: 'string', enum: Object.values(UserRole) }, phoneNumber: { type: 'string', nullable: true }, address: { type: 'string', nullable: true }, dateOfBirth: { type: 'string', format: 'date', nullable: true }, preferredPronoun: { type: 'string', nullable: true } } }, { type: 'object', properties: { message: { type: 'string', example: 'Password changed successfully' } } }] } })
@ApiResponse({ status: 400, description: 'Invalid action, fields, profile data, or password' })
@ApiResponse({ status: 401, description: 'Authentication required or current password is incorrect' })
@ApiResponse({ status: 404, description: 'User not found' })
@ApiResponse({ status: 500, description: 'An unexpected server error occurred.' })
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@ApiBearerAuth('access-token')
manageMyAccount(@Req() req: AuthenticatedRequest, @Body() dto: ManageMyAccountDto) {
  const profileFields = ['phoneNumber', 'address', 'dateOfBirth', 'preferredPronoun'] as const;
  const passwordFields = ['currentPassword', 'newPassword'] as const;
  const suppliedProfileFields = profileFields.filter((field) => dto[field] !== undefined);
  const suppliedPasswordFields = passwordFields.filter((field) => dto[field] !== undefined);

  if (dto.action === MyAccountAction.UPDATE_PROFILE) {
    if (suppliedProfileFields.length === 0 || suppliedPasswordFields.length > 0) {
      throw new BadRequestException('Provide one or more profile fields only for update_profile');
    }
  } else if (
    suppliedProfileFields.length > 0 ||
    suppliedPasswordFields.length !== passwordFields.length
  ) {
    throw new BadRequestException('Provide currentPassword and newPassword only for change_password');
  }

  return this.usersService.manageMyAccount(req.user!.sub, dto);
}

@Post('me/delete')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: 'Request deletion of your account; logging in within five days cancels it' })
@ApiResponse({ status: 200, description: 'Account deletion scheduled.', schema: { type: 'object', properties: { message: { type: 'string', example: 'Account deletion scheduled in five days; log in before then to cancel it' } } } })
@ApiResponse({ status: 401, description: 'Authentication is missing or invalid.' })
@ApiResponse({ status: 404, description: 'User not found.' })
@ApiResponse({ status: 500, description: 'An unexpected server error occurred.' })
deleteMyAccount(@Req() req: AuthenticatedRequest) {
  return this.usersService.requestAccountDeletion(req.user!.sub);
}

@Patch(':id')
@ApiOperation({ summary: 'Perform one account action: deactivate, reactivate, or assign a role' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiBody({ type: ManageUserDto })
@ApiResponse({ status: 200, description: 'Requested account action completed.', schema: { oneOf: [{ type: 'object', properties: { id: { type: 'string', format: 'uuid' }, isActive: { type: 'boolean' } } }, { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, role: { type: 'string', enum: Object.values(UserRole) } } }] } })
@ApiResponse({ status: 401, description: 'Authentication required' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@ApiResponse({ status: 400, description: 'Invalid action, action fields, role, or account state' })
@ApiResponse({ status: 404, description: 'Target user or acting user not found' })
@ApiResponse({ status: 500, description: 'An unexpected server error occurred.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGING_DIRECTOR, UserRole.DEPARTMENT_HEAD)
@ApiBearerAuth('access-token')
manageUser(
  @Param('id', ParseUUIDPipe) userId: string,
  @Body() manageUserDto: ManageUserDto,
  @Req() request: AuthenticatedRequest,
  ) {
    if (manageUserDto.action === UserManagementAction.ASSIGN_ROLE && !manageUserDto.role) {
      throw new BadRequestException('role is required when action is assign_role');
    }
    if (manageUserDto.action !== UserManagementAction.ASSIGN_ROLE && manageUserDto.role !== undefined) {
      throw new BadRequestException('role can only be provided when action is assign_role');
    }
    return this.usersService.manageUser(userId, manageUserDto, request.user!.sub);
  }

@Get('me')
@ApiOperation({ summary: 'User must view his profile (every user in the system)' })
@ApiResponse({ status: 200, description: 'User profile', schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', nullable: true, enum: Object.values(UserRole) }, department: { type: 'string', nullable: true }, team: { type: 'string', nullable: true } } } })
@ApiResponse({ status: 401, description: 'Authentication required' })
@ApiResponse({ status: 404, description: 'User not found' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@ApiResponse({ status: 500, description: 'An unexpected server error occurred.' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
 async getMyProfile(@Req() req: AuthenticatedRequest){
   const userId = req.user!.sub;

   return this.usersService.getMyProfile(userId)
 }

}
