import {Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { AssignProjectTeamsDto } from './dto/assign-project-teams.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id/teams')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT_HEAD)
  assignTeams(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignProjectTeamsDto: AssignProjectTeamsDto,
  ) {
    return this.projectsService.assignTeams(id, assignProjectTeamsDto.teamIds);
  }
}
