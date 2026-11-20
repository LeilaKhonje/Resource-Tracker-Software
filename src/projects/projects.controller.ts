import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { AssignProjectTeamsDto } from './dto/assign-project-teams.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectTeamMembersQueryDto } from './dto/project-team-members-query.dto';
import { ProjectsService } from './projects.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '../common/swagger-response.decorators';

@ApiTags('Projects')
@ApiStandardErrorResponses(401, 403, 500)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a new project', description: 'Department Head only. Team IDs, when supplied, must belong to the caller’s department.' })
  @ApiResponse({ status: 201, description: 'Created project', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } })
  @ApiResponse({ status: 400, description: 'Invalid project fields' })
  @ApiResponse({ status: 422, description: 'One or more team IDs do not exist' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiBody({
    schema: {
      type: 'object',
        required: ['name', 'startDate', 'endDate'],
      properties: {
        name: {
          type: 'string',
          example: 'New Project'
        },
        description: { type: 'string', maxLength: 1000, example: 'Upgrade office equipment' },
        startDate: { type: 'string', format: 'date', example: '2026-01-01' },
        endDate: { type: 'string', format: 'date', example: '2026-12-31' },
        teamIds: { type: 'array', items: { type: 'integer', minimum: 1 }, example: [1] }
      }
    }
  })
  @Post('')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  create(@Body() createProjectDto: CreateProjectDto, @Req() request: AuthenticatedRequest) {
    return this.projectsService.create(createProjectDto, request.user!);
  }

  @ApiOperation({ summary: 'List projects visible to the caller', description: 'Department Heads see projects linked to teams in their department; Managing Directors see all projects.' })
  @ApiResponse({ status: 200, description: 'Projects visible to the caller', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, department: { type: 'object' } } } } } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @Get('')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findAll(@Req() request: AuthenticatedRequest) {
    return this.projectsService.findAll(request.user!);
  }

  @ApiOperation({ summary: 'List projects in a department', description: 'Managing Director only.' })
  @ApiParam({ name: 'departmentId', type: Number, description: 'Numeric department ID' })
  @ApiResponse({ status: 200, description: 'Projects assigned to teams in the specified department', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' }, teams: { type: 'array', items: { type: 'object', additionalProperties: true } } } } } })
  @ApiResponse({ status: 400, description: 'Department ID must be an integer' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Only managing directors can view projects by department' })
  @Get('department/:departmentId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGING_DIRECTOR)
  findByDepartment(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return this.projectsService.findByDepartment(departmentId);
  }

  @ApiOperation({ summary: 'Get a project by ID', description: 'Department Heads can view projects linked to their department; Managing Directors can view any project.' })
  @ApiResponse({ status: 200, description: 'Project record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, department: { type: 'object' } } } } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found: Project does not exist' })
  @ApiResponse({ status: 400, description: 'Project ID must be an integer.' })
  @Get(':id')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.findOne(id, request.user!);
  }

  @ApiOperation({ summary: 'Replace the team assigned to a project', description: 'Department Head only. This endpoint accepts at most one team ID; the team must belong to the caller’s department and a project must retain one assigned team.' })
  @ApiResponse({ status: 200, description: 'Updated project record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date' }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } })
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
          example: [1],
          maxItems: 1
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

  @ApiOperation({ summary: 'Update a project name, description, or time span', description: 'Department Head only. The project must be assigned to a team in the caller’s department; endDate must not precede startDate.' })
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

  @ApiOperation({ summary: 'List project members grouped by team, optionally filtered to one team' })
  @ApiResponse({ status: 200, description: 'Project members grouped by team', schema: { type: 'object', properties: { projectId: { type: 'integer' }, projectName: { type: 'string' }, teams: { type: 'array', items: { type: 'object', properties: { teamId: { type: 'integer' }, teamName: { type: 'string' }, members: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' } } } } } } } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions or department access' })
  @ApiResponse({ status: 404, description: 'Project does not exist' })
  @ApiResponse({ status: 400, description: 'Project ID must be an integer.' })
  @ApiQuery({ name: 'teamId', required: false, type: Number, description: 'Return members from this team only; the team must be assigned to the project.' })
  @Get(':id/team-members')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findTeamMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ProjectTeamMembersQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.findTeamMembers(id, request.user!, query.teamId);
  }

  @ApiOperation({ summary: 'Delete a project by ID', description: 'Department Head only. The project must be assigned to a team in the caller’s department.' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation', schema: { type: 'object', properties: { message: { type: 'string', example: 'Project with id 1 deleted successfully' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found: Project does not exist' })
  @ApiResponse({ status: 400, description: 'Project ID must be an integer.' })
  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, description: 'Numeric project ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.remove(id, request.user!);
  }
}
