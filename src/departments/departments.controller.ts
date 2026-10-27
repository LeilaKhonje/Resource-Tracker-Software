import {Body,Controller,Post,Param,Get,Patch,Delete} from '@nestjs/common';
import {CreateDepartmentDto} from './dto/create-department.dto';
import {UpdateDepartmentDto} from './dto/update-departments.dto';
import { DepartmentsService } from './departments.service';

@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}

    @Post()
    create(@Body() createDepartmentDto : CreateDepartmentDto) {
        return this.departmentsService.create (createDepartmentDto);
    }
    @Get()
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
     update(@Param('id') id: string,@Body() updateDepartmentDto:UpdateDepartmentDto) {
        return this.departmentsService.update(Number(id), updateDepartmentDto)

       }
    @Delete(':id')
        remove(@Param('id') id:string){
         return this.departmentsService.remove(Number(id));
         }
    }