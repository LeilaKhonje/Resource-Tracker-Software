import {Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { AssignProjectTeamsDto } from './dto/assign-project-teams.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  create(@Body() createProjectDto: CreateProjectDto, @Req() request: AuthenticatedRequest) {
    return this.projectsService.create(createProjectDto, request.user!);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findAll(@Req() request: AuthenticatedRequest) {
    return this.projectsService.findAll(request.user!);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.projectsService.findOne(id, request.user!);
  }

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
}
