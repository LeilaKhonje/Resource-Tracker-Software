import {Body,Controller,Post,Param,Get,Patch,Delete} from '@nestjs/common';
import {CreateDepartmentDto} from './dto/create-department.dto';
import {UpdateDepartmentDto} from './dto/update-departments.dto';
import { DepartmentsService } from './departments.service';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a department' })
    @ApiBody({ type: CreateDepartmentDto })
    @ApiResponse({ status: 201, description: 'Department created' })
    create(@Body() createDepartmentDto : CreateDepartmentDto) {
        return this.departmentsService.create (createDepartmentDto);
    }
    @Get()
    @ApiOperation({ summary: 'List departments' })
    @ApiResponse({ status: 200, description: 'Departments returned' })
     findAll(){
        return this.departmentsService.findAll();
     }
     @Get(':id')
     findOne(@Param('id') id: string) {
        return this.departmentsService.findOne(Number(id));
     }
     @Get(':id/users')
     findUsers(@Param('id') id: string) {
        return this.departmentsService.findUsers(Number(id));
     }
     @Get(':id/teams')
     findTeams(@Param('id') id: string) {
        return this.departmentsService.findTeams(Number(id));
     }
     @Get(':id/projects')
     findProjects(@Param('id') id: string) {
        return this.departmentsService.findProjects(Number(id));
     }
     @Get(':id/teams/:teamId/projects')
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
     @ApiOperation({ summary: 'Update a department' })
     @ApiParam({ name: 'id', description: 'Department ID' })
     @ApiBody({ type: UpdateDepartmentDto })
     @ApiResponse({ status: 200, description: 'Department updated' })
     update(@Param('id') id: string,@Body() updateDepartmentDto:UpdateDepartmentDto) {
        return this.departmentsService.update(Number(id), updateDepartmentDto)

       }
    @Delete(':id')
        @ApiOperation({ summary: 'Delete a department' })
        @ApiParam({ name: 'id', description: 'Department ID' })
        @ApiResponse({ status: 200, description: 'Department deleted' })
        remove(@Param('id') id:string){
         return this.departmentsService.remove(Number(id));
         }
    }
