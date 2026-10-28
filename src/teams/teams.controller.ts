import {Body, Controller,Delete,Get,Param,Patch,
  Post,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a team' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: 'Created team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } })
  @ApiResponse({ status: 400, description: 'Invalid team fields' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'List teams' })
  @ApiResponse({ status: 200, description: 'Team records', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } } })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'List users assigned to a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team members', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', nullable: true } } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findUsers(@Param('id') id: string) {
    return this.teamsService.findUsers(Number(id));
  }

  @Get(':id/projects')
  @ApiOperation({ summary: 'List projects assigned to a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team projects', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } } } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findProjects(@Param('id') id: string) {
    return this.teamsService.findProjects(Number(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team by ID' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(Number(id));
  }

  @Patch(':id')
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
  @ApiOperation({ summary: 'Delete a team' })
  @ApiParam({ name: 'id', description: 'Numeric team ID', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Deleted team record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object', nullable: true } } } })
  @ApiResponse({ status: 404, description: 'Team not found' })
  remove(@Param('id') id: string) {
    return this.teamsService.remove(Number(id));
  }
}
