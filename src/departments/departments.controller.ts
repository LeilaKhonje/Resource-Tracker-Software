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
     @Patch(':id')
     update(@Param('id') id: string,@Body() updateDepartmentDto:UpdateDepartmentDto) {
        return this.departmentsService.update(Number(id), updateDepartmentDto)

       }
    @Delete(':id')
        remove(@Param('id') id:string){
         return this.departmentsService.remove(Number(id));
         }
    }