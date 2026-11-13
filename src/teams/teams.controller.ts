import {Body, Controller,Delete,Get,Param,Patch, Post, ParseIntPipe, Query, Req, UseGuards,} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AssignTeamLeadDto } from './dto/assign-team-lead.dto';
import { AssignTeamUserDto } from './dto/assign-team-user.dto';

@ApiTags('Teams')
@Controller('api/v1/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a team' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: 'Created team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } })
  @ApiResponse({ status: 400, description: 'Invalid team fields' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  @ApiResponse({ status: 200, description: 'List of teams', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiOperation({ summary: 'List teams' })
  @ApiResponse({ status: 200, description: 'Team records', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } } })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get('unassigned-users')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'List active Team Leads and Team Members without a team' })
  @ApiQuery({ name: 'role', required: false, enum: [UserRole.TEAM_LEAD, UserRole.TEAM_MEMBER] })
  @ApiResponse({ status: 200, description: 'Unassigned active users, ordered by name' })
  @ApiResponse({ status: 400, description: 'Role filter must be team_lead or team_member' })
  findUnassignedUsers(@Query('role') role?: string) {
    return this.teamsService.findUnassignedUsers(role);
  }

  @Get(':id/users')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD, UserRole.TEAM_MEMBER)
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team members', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', nullable: true } } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiOperation({ summary: 'List users assigned to a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team members', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', nullable: true } } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findUsers(@Param('id') id: string) {
    return this.teamsService.findUsers(Number(id));
  }

  @Get(':id/projects')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD, UserRole.TEAM_MEMBER)
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team projects', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiOperation({ summary: 'List projects assigned to a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team projects', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findProjects(@Param('id') id: string) {
    return this.teamsService.findProjects(Number(id));
  }

  @Get(':id/resource-requests')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEAM_LEAD, UserRole.TEAM_MEMBER)
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team resource requests', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, description: { type: 'string', nullable: true }, status: { type: 'string' }, teamId: { type: 'integer' } } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiOperation({ summary: 'List resource requests for a team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team resource requests returned' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEAM_LEAD, UserRole.TEAM_MEMBER)
  findResourceRequests(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.teamsService.findResourceRequests(id, request.user!);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD, UserRole.TEAM_MEMBER, UserRole.MANAGING_DIRECTOR)
  @ApiResponse({ status: 200, description: 'Team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } })
  @ApiOperation({ summary: 'Get a team by ID' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(Number(id));
  }

  @Patch(':id/team-lead')
  @ApiOperation({ summary: 'Assign a team lead to a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number })
  @ApiBody({ type: AssignTeamLeadDto })
  @ApiResponse({ status: 200, description: 'Team lead assigned to the team' })
  @ApiResponse({ status: 403, description: 'Caller is not the department head for this team, or target user is not a team lead' })
  @ApiResponse({ status: 404, description: 'Team or user not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  assignTeamLead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTeamLeadDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.teamsService.assignTeamLead(id, dto, request.user!);
  }

  @Patch(':id/assign-user')
  @ApiOperation({ summary: 'Assign a Team Lead or Team Member to a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number })
  @ApiBody({ type: AssignTeamUserDto })
  @ApiResponse({ status: 200, description: 'User assigned to the team and its department' })
  @ApiResponse({ status: 403, description: 'Target is inactive, has an unsupported role, or caller is not the team department head' })
  @ApiResponse({ status: 409, description: 'Target user is already assigned to another team' })
  @ApiResponse({ status: 404, description: 'Team or user not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  assignUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTeamUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.teamsService.assignTeamUser(id, dto, request.user!);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiBody({ type: UpdateTeamDto })
  @ApiOperation({ summary: 'Update a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiBody({ type: UpdateTeamDto })
  @ApiResponse({ status: 200, description: 'Updated team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } })
  @ApiResponse({ status: 400, description: 'Invalid team fields' })
  @ApiResponse({ status: 404, description: 'Team or requested department not found' })
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(Number(id), updateTeamDto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Delete a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Deleted team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  remove(@Param('id') id: string) {
    return this.teamsService.remove(Number(id));
  }
}
