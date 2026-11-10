import { toResourceResponse } from './resource-response';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../users/user-role.enum'; 
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth} from '@nestjs/swagger';

@ApiTags('Resources')
@Controller('api/v1/resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEPARTMENT_HEAD)
@ApiBearerAuth('access-token')

export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a resource',
    description:
      'Creates an insourced or outsourced resource. Supply name and type, plus the fields required for that type: description and department for insourced resources; price, label, batchNumber, and vendor for outsourced resources.',
  })
  @ApiBody({ type: CreateResourceDto })
  @ApiResponse({ status: 201, description: 'Resource created. The response includes common fields and only the fields for its resource type.' })
  @ApiResponse({ status: 400, description: 'Validation failed: name or type is missing/invalid, a type-specific required field is missing/invalid, or price is negative or has more than two decimal places.' })
  async create(@Body() dto: CreateResourceDto) {
    return toResourceResponse(await this.resourcesService.create(dto));
  }

  @Get()
  @ApiOperation({
    summary: 'List resources',
    description: 'Returns resources newest first. Optional filters can match a name substring and/or an exact resource type.',
  })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Case-insensitive substring to match in the resource name.'})
  @ApiQuery({ name: 'type', required: false, enum: ['insourced', 'outsourced'], description: 'Return only resources of this type.' })
  @ApiResponse({ status: 200, description: 'Array of resources matching the filters. Each item includes id, name, type, createdAt, updatedAt, and the fields for its type.' })
  @ApiResponse({ status: 400, description: 'Validation failed: name is not a string or type is not "insourced" or "outsourced".' })
  async findAll(@Query() query: QueryResourceDto) {
    const resources = await this.resourcesService.findAll(query);
    return resources.map(toResourceResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource', description: 'Returns one resource by its UUID.' })
  @ApiParam({ name: 'id', description: 'UUID of the resource.', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Resource record with common fields and the fields for its type.' })
  @ApiResponse({ status: 400, description: 'The id path parameter is not a valid UUID.' })
  @ApiResponse({ status: 404, description: 'No resource exists with the supplied UUID.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return toResourceResponse(await this.resourcesService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a resource',
    description: 'Updates one or more fields on a resource. All body fields are optional and the resource type cannot be changed. Only fields belonging to the resource’s existing type may be supplied.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the resource.', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateResourceDto, description: 'One or more fields valid for the resource’s existing type.' })
  @ApiResponse({ status: 200, description: 'Updated resource record.' })
  @ApiResponse({ status: 400, description: 'The id is not a valid UUID; the body contains fields belonging to the other resource type (for example, vendor on an insourced resource); or the body includes type/another unknown field, which request validation rejects.' })
  @ApiResponse({ status: 404, description: 'No resource exists with the supplied UUID.' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateResourceDto) {
    return toResourceResponse(await this.resourcesService.update(id, dto));
  }
}
