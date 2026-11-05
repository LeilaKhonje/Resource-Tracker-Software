import {Body,Controller,Post,Param,Get,Patch,Delete,ParseIntPipe,Req,UseGuards} from '@nestjs/common';
import {CreateDepartmentDto} from './dto/create-department.dto';
import {UpdateDepartmentDto} from './dto/update-departments.dto';
import { DepartmentsService } from './departments.service';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags,} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Departments')
@Controller('api/v1/departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}

    @Post('')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MANAGING_DIRECTOR)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a department' })
    @ApiBody({ type: CreateDepartmentDto })
    @ApiResponse({ status: 201, description: 'Created department record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } } })
    @ApiResponse({ status: 400, description: 'Invalid department fields' })
    create(@Body() createDepartmentDto : CreateDepartmentDto) {
        return this.departmentsService.create (createDepartmentDto);
    }
    @Get('')
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MANAGING_DIRECTOR)
    @ApiOperation({ summary: 'List departments' })
    @ApiResponse({ status: 200, description: 'Array of department records', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } } } })
     findAll(){
        return this.departmentsService.findAll();
     }

     @Get(':id')
     @ApiBearerAuth('access-token')
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.MANAGING_DIRECTOR, UserRole.DEPARTMENT_HEAD)
     @ApiOperation({ summary: 'Get a department by ID' })
     @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
     @ApiResponse({ status: 200, description: 'Department record with numeric ID, name, optional code, and description', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } } })
     @ApiResponse({ status: 404, description: 'Department not found' })
     findOne(@Param('id') id: string) {
        return this.departmentsService.findOne(Number(id));
     }

     @Get(':id/users')
     @ApiBearerAuth('access-token')
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.MANAGING_DIRECTOR, UserRole.DEPARTMENT_HEAD)
     @ApiResponse({ status: 404, description: 'Department not found' })
     @ApiOperation({ summary: 'List users in a department' })
     @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
     @ApiResponse({ status: 200, description: 'Array of users assigned to the department', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', nullable: true } } } } })
     @ApiResponse({ status: 404, description: 'Department not found' })
     findUsers(@Param('id') id: string) {
        return this.departmentsService.findUsers(Number(id));
     }

     @Get(':id/teams')
     @ApiBearerAuth('access-token')
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.MANAGING_DIRECTOR)
     @ApiOperation({ summary: 'List teams in a department' })
     @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
     @ApiResponse({ status: 200, description: 'Array of department teams', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' }, department: { type: 'object' } } } } })
     @ApiResponse({ status: 404, description: 'Department not found' })
     findTeams(@Param('id') id: string) {
        return this.departmentsService.findTeams(Number(id));
     }

     @Get(':id/projects')
     @ApiBearerAuth('access-token')
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.MANAGING_DIRECTOR, UserRole.DEPARTMENT_HEAD)
     @ApiOperation({ summary: 'List projects in a department' })
     @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
     @ApiResponse({ status: 200, description: 'Array of department projects and associated teams', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object' } } } } } })
     @ApiResponse({ status: 404, description: 'Department not found' })
     findProjects(@Param('id') id: string) {
        return this.departmentsService.findProjects(Number(id));
     }

     @Get(':id/resource-requests')
     @ApiOperation({ summary: 'List resource requests for a department' })
     @ApiParam({ name: 'id', description: 'Department ID' })
     @ApiResponse({ status: 200, description: 'Department resource requests returned' })
     @ApiBearerAuth('access-token')
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.DEPARTMENT_HEAD, UserRole.MANAGING_DIRECTOR)
     @ApiBearerAuth('access-token')
     @UseGuards(JwtAuthGuard, RolesGuard)
     findResourceRequests(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: AuthenticatedRequest,
     ) {
        return this.departmentsService.findResourceRequests(id, request.user!);
     }

     @Get(':id/teams/:teamId/projects')
     @ApiBearerAuth('access-token')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(UserRole.MANAGING_DIRECTOR)
     @ApiOperation({ summary: 'List projects assigned to a team in a department' })
     @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
     @ApiParam({ name: 'teamId', description: 'Numeric team ID in the department', type: Number, example: 2 })
     @ApiResponse({ status: 200, description: 'Array of team project records', schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, teams: { type: 'array', items: { type: 'object' } } } } } })
     @ApiResponse({ status: 404, description: 'Department or team in that department not found' })
     findTeamProjects(
        @Param('id') id: string,
        @Param('teamId') teamId: string,
     ) {
        return this.departmentsService.findTeamProjects(
            Number(id),
            Number(teamId),
        );
     }

     @Patch(':id')
     @ApiBearerAuth('access-token')
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.MANAGING_DIRECTOR)
     @ApiOperation({ summary: 'Update a department' })
     @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
     @ApiBody({ type: UpdateDepartmentDto })
     @ApiResponse({ status: 200, description: 'Updated department record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } } })
     @ApiResponse({ status: 400, description: 'Invalid department fields' })
     @ApiResponse({ status: 404, description: 'Department not found' })
     update(@Param('id') id: string,@Body() updateDepartmentDto:UpdateDepartmentDto) {
        return this.departmentsService.update(Number(id), updateDepartmentDto)

       }
    @Delete(':id')
      @ApiOperation({ summary: 'Delete a department' })
      @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
      @ApiResponse({ status: 200, description: 'Deleted department record', schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, code: { type: 'string', nullable: true }, description: { type: 'string' } } } })
      @ApiResponse({ status: 404, description: 'Department not found' })
      @ApiBearerAuth('access-token')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(UserRole.MANAGING_DIRECTOR)
      remove(@Param('id') id:string){
         return this.departmentsService.remove(Number(id));
         }

   @Patch(':id/assign-head/:userId')
   @ApiOperation({ summary: 'Assign a department head to a department' })
   @ApiParam({ name: 'id', description: 'Numeric department ID', type: Number, example: 1 })
   @ApiParam({ name: 'userId', description: 'UUID of the user to be assigned as department head', type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
   @ApiResponse({ status: 200, description: 'Department head assigned successfully' })
   @ApiResponse({ status: 404, description: 'Department or user not found' })
   @ApiResponse({ status: 403, description: 'Forbidden. Only managing directors can assign department heads.' })
   @ApiBearerAuth('access-token')
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.MANAGING_DIRECTOR)
   assignDepartmentHead(
      @Param('id') departmentId: string,
      @Param('userId') userId: string,
   ) {
      return this.departmentsService.assignDepartmentHead(
         Number(departmentId),
         userId,
      );
   }
    }
