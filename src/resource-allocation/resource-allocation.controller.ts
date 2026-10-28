import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ResourceAllocationService } from './resource-allocation.service';
import { CreateResourceAllocationDto } from './dto/create-resource-allocation.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
@ApiTags('Resource Allocations')
@Controller('resource-allocation')
export class ResourceAllocationController { constructor(private readonly resourceAllocationService: ResourceAllocationService,){}

@Get()
@ApiOperation({ summary: 'List resource allocations' })
@ApiResponse({ status: 200, description: 'Resource allocations returned' })
findAll(){
    return
    this.resourceAllocationService.findAll();
}

@Get('.:id')
@ApiOperation({ summary: 'Get a resource allocation by ID' })
@ApiParam({ name: 'id', description: 'Resource allocation ID' })
@ApiResponse({ status: 200, description: 'Resource allocation returned' })
findOne(@Param('id', ParseIntPipe) id: number){
    return
    this.resourceAllocationService.findOne(id);
}
@Post()
@ApiOperation({ summary: 'Create a resource allocation' })
@ApiBody({ type: CreateResourceAllocationDto })
@ApiResponse({ status: 201, description: 'Resource allocation created' })
create(@Body() dto: 
CreateResourceAllocationDto){
    return
    this.resourceAllocationService.create(dto);
}
}
