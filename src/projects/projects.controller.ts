import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { AssignProjectTeamsDto } from './dto/assign-project-teams.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiTags, ApiOperation, ApiBody, ApiResponse  } from '@nestjs/swagger';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          example: 'New Project'
        }
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
  @ApiResponse({ status: 200, description: 'Return all projects' })
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
  @ApiResponse({ status: 200, description: 'Return the specified project' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found: Project does not exist' })
  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.findOne(id, request.user!);
  }

  @ApiOperation({ summary: 'Assign teams to a project' })
  @ApiResponse({ status: 200, description: 'Teams assigned to the project successfully' })
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

  @ApiOperation({ summary: 'Delete a project by ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found: Project does not exist' })
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.remove(id, request.user!);
  }
}
