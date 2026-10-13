import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ResourceAllocationService } from './resource-allocation.service';
import { CreateResourceAllocationDto } from './dto/create-resource-allocation.dto';
@Controller('resource-allocation')
export class ResourceAllocationController { constructor(private readonly resourceAllocationService: ResourceAllocationService,){}

@Get()
findAll(){
    return
    this.resourceAllocationService.findAll();
}

@Get('.:id')
findOne(@Param('id', ParseIntPipe) id: number){
    return
    this.resourceAllocationService.findOne(id);
}
@Post()
create(@Body() dto: 
CreateResourceAllocationDto){
    return
    this.resourceAllocationService.create(dto);
}
}