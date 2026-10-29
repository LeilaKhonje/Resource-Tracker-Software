import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { AssignProjectTeamsDto } from './dto/assign-project-teams.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Created project', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } })
  @ApiResponse({ status: 400, description: 'Invalid project fields' })
  @ApiResponse({ status: 422, description: 'At least one valid team is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiBody({
    schema: {
      type: 'object',
        required: ['name', 'teamIds'],
      properties: {
        name: {
          type: 'string',
          example: 'New Project'
        },
        description: { type: 'string', maxLength: 1000, example: 'Upgrade office equipment' },
        teamIds: { type: 'array', items: { type: 'integer', minimum: 1 }, example: [1] }
      }
    }
  })
  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  create(@Body() createProjectDto: CreateProjectDto, @Req() request: AuthenticatedRequest) {
    return this.projectsService.create(createProjectDto, request.user!);
  }

  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Projects visible to the caller', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, department: { type: 'object' } } } } } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findAll(@Req() request: AuthenticatedRequest) {
    return this.projectsService.findAll(request.user!);
  }

  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiResponse({ status: 200, description: 'Project record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, department: { type: 'object' } } } } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found: Project does not exist' })
  @Get(':id')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.findOne(id, request.user!);
  }

  @ApiOperation({ summary: 'Assign teams to a project' })
  @ApiResponse({ status: 200, description: 'Updated project record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } })
  @ApiResponse({ status: 400, description: 'Invalid team IDs' })
  @ApiResponse({ status: 422, description: 'Team IDs are missing/unknown or no team remains assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found: Project does not exist' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['teamIds'],
      properties: {
        teamIds: {
          type: 'array',
          items: {
            type: 'integer',
            example: 1
          },
          example: [1, 2]
        }
      }
    }
  })
  @Patch(':id/teams')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  assignTeams(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignProjectTeamsDto: AssignProjectTeamsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.assignTeams(id, assignProjectTeamsDto.teamIds, request.user!);
  }

  @ApiOperation({ summary: 'Update a project name or description' })
  @ApiResponse({ status: 200, description: 'Updated project record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } })
  @ApiResponse({ status: 400, description: 'No project fields supplied' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions or department access' })
  @ApiResponse({ status: 404, description: 'Project does not exist' })
  @Patch(':id')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.update(id, updateProjectDto, request.user!);
  }

  @ApiOperation({ summary: 'List team member names for a project' })
  @ApiResponse({ status: 200, description: 'Project team members', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, teamId: { type: 'integer' }, teamName: { type: 'string' } } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions or department access' })
  @ApiResponse({ status: 404, description: 'Project does not exist' })
  @Get(':id/team-members')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findTeamMembers(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.findTeamMembers(id, request.user!);
  }

  @ApiOperation({ summary: 'Delete a project by ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation', schema: { type: 'object', properties: { message: { type: 'string', example: 'Project with id 1 deleted successfully' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found: Project does not exist' })
  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.remove(id, request.user!);
  }
}
