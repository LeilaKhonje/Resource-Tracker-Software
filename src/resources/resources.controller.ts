import { toResourceResponse } from './resource-response';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';


@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}


@Post()
async create(@Body() dto: CreateResourceDto) {
  return toResourceResponse(await this.resourcesService.create(dto));
}

@Get()
async findAll(@Query() query: QueryResourceDto) {
  const resources = await this.resourcesService.findAll(query);
  return resources.map(toResourceResponse);
}

@Get(':id')
async findOne(@Param('id', ParseUUIDPipe) id: string) {
  return toResourceResponse(await this.resourcesService.findOne(id));
}

@Patch(':id')
async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateResourceDto) {
  return toResourceResponse(await this.resourcesService.update(id, dto));
}
}
