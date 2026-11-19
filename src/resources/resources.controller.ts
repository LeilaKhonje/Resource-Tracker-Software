import { toResourceResponse } from './resource-response';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { QueryResourceDto } from './dto/query-resource.dto';
import { CreateResourceAllocationDto } from './dto/create-resource-allocation.dto';
import { TransferResourceAllocationDto } from './dto/transfer-resource-allocation.dto';
import { ReturnResourceAllocationDto } from './dto/return-resource-allocation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateInsourcedResourceDto } from './dto/update-insourced-resource.dto';
import { UpdateOutsourcedResourceDto } from './dto/update-outsourced-resource.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '../common/swagger-response.decorators';

@ApiTags('Resources')
@ApiStandardErrorResponses(400, 401, 403, 500)
@Controller('api/v1/resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEPARTMENT_HEAD)
@ApiBearerAuth('access-token')

export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGING_DIRECTOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create an insourced or outsourced resource (Managing Director only)',
    description:
      'The required fields depend on type: insourced requires description and departmentName; outsourced requires price, label, batchNumber, and vendor.',
  })
  @ApiBody({ type: CreateResourceDto })
  @ApiResponse({ status: 201, description: 'Resource created.' })
  @ApiResponse({ status: 400, description: 'Invalid fields for the selected resource type.' })
  @ApiResponse({ status: 404, description: 'The named department does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
  @ApiForbiddenResponse({ description: 'Only the Managing Director can create resources.' })
  async create(@Body() dto: CreateResourceDto) {
    return toResourceResponse(await this.resourcesService.createResource(dto));
  }

  @Get()
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.LINE_MANAGER, UserRole.MANAGING_DIRECTOR)
  @ApiOperation({
    summary: 'List resources',
    description: 'Returns resources newest first. Optional filters can match a name substring and/or an exact resource type.',
  })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Case-insensitive substring to match in the resource name.'})
  @ApiQuery({ name: 'type', required: false, enum: ['insourced', 'outsourced'], description: 'Return only resources of this type.' })
  @ApiResponse({ status: 200, description: 'Array of resources matching the filters. Each item includes id, name, type, status, quantity, createdAt, updatedAt, and the fields for its type.', schema: { type: 'array', items: { oneOf: [{ type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, type: { type: 'string', enum: ['insourced'] }, status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED'] }, batchNumber: { type: 'string' }, quantity: { type: 'integer' }, description: { type: 'string', nullable: true }, departmentName: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }, { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, type: { type: 'string', enum: ['outsourced'] }, status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED'] }, batchNumber: { type: 'string' }, quantity: { type: 'integer' }, price: { type: 'number' }, label: { type: 'string' }, vendor: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] } } })
  @ApiResponse({ status: 400, description: 'Validation failed: name is not a string or type is not "insourced" or "outsourced".' })
  async findAll(@Query() query: QueryResourceDto) {
    const resources = await this.resourcesService.findAll(query);
    return resources.map(toResourceResponse);
  }

  @Post(':id/allocations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LINE_MANAGER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Allocate available resource units to a team member (Line Manager only)' })
  @ApiParam({ name: 'id', description: 'Resource UUID', format: 'uuid' })
  @ApiBody({ type: CreateResourceAllocationDto })
  @ApiResponse({ status: 201, description: 'Created active allocation and recorded an allocation movement.', schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, quantity: { type: 'integer' }, status: { type: 'string', enum: ['ACTIVE'] }, resource: { type: 'object', additionalProperties: true }, team: { type: 'object', additionalProperties: true }, project: { type: 'object', additionalProperties: true }, assignedTo: { type: 'object', additionalProperties: true }, allocatedBy: { type: 'object', additionalProperties: true }, request: { type: 'object', nullable: true, additionalProperties: true }, expectedReturnAt: { type: 'string', format: 'date-time', nullable: true }, returnedAt: { type: 'string', format: 'date-time', nullable: true }, allocatedAt: { type: 'string', format: 'date-time' } } } })
  @ApiResponse({ status: 400, description: 'Invalid destination or allocation data.' })
  @ApiResponse({ status: 401, description: 'A valid bearer access token is required.' })
  @ApiResponse({ status: 403, description: 'Only Line Managers can allocate resources or allocate against requests assigned to them.' })
  @ApiResponse({ status: 404, description: 'Resource, team, project, assigned user, or request not found.' })
  @ApiResponse({ status: 409, description: 'Insufficient available quantity or request already fulfilled.' })
  async createAllocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateResourceAllocationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.resourcesService.createAllocation(id, dto, request.user!.sub);
  }
  

  @Get(':id/allocations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LINE_MANAGER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active allocations for a resource (Line Manager only)' })
  @ApiParam({ name: 'id', description: 'Resource UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Active assignments, including current user, team, project, and return deadline.', schema: { type: 'array', items: { type: 'object', additionalProperties: true } } })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  @ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
  @ApiForbiddenResponse({ description: 'Only Line Managers can view allocations.' })
  async getActiveAllocations(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.getActiveAllocations(id);
  }

  @Get(':id/movements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LINE_MANAGER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'View the movement history for a resource (Line Manager only)' })
  @ApiParam({ name: 'id', description: 'Resource UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Chronological allocation, transfer, and return events.', schema: { type: 'array', items: { type: 'object', additionalProperties: true } } })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  @ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
  @ApiForbiddenResponse({ description: 'Only Line Managers can view movement history.' })
  async getResourceMovements(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.getResourceMovements(id);
  }

  @Patch('allocations/:allocationId/return')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LINE_MANAGER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Record the return of an active allocation (Line Manager only)' })
  @ApiParam({ name: 'allocationId', description: 'Allocation UUID', format: 'uuid' })
  @ApiBody({ type: ReturnResourceAllocationDto })
  @ApiResponse({ status: 200, description: 'Allocation marked returned and movement event recorded.', schema: { type: 'object', additionalProperties: true } })
  @ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
  @ApiForbiddenResponse({ description: 'Only Line Managers can record returns.' })
  @ApiResponse({ status: 404, description: 'Allocation not found.' })
  @ApiResponse({ status: 409, description: 'Allocation is not active.' })
  async returnAllocation(
    @Param('allocationId', ParseUUIDPipe) allocationId: string,
    @Body() dto: ReturnResourceAllocationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.resourcesService.returnAllocation(allocationId, request.user!.sub, dto.note);
  }

  @Patch('allocations/:allocationId/transfer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LINE_MANAGER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Transfer an active allocation to another team member (Line Manager only)' })
  @ApiParam({ name: 'allocationId', description: 'Allocation UUID', format: 'uuid' })
  @ApiBody({ type: TransferResourceAllocationDto })
  @ApiResponse({ status: 200, description: 'Previous assignment closed, new assignment created, and transfer movement recorded.', schema: { type: 'object', additionalProperties: true } })
  @ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
  @ApiForbiddenResponse({ description: 'Only Line Managers can transfer allocations.' })
  @ApiResponse({ status: 404, description: 'Allocation, team, project, or assigned user not found.' })
  @ApiResponse({ status: 409, description: 'Allocation is not active.' })
  async transferAllocation(
    @Param('allocationId', ParseUUIDPipe) allocationId: string,
    @Body() dto: TransferResourceAllocationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.resourcesService.transferAllocation(allocationId, dto, request.user!.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource', description: 'Returns one resource by its UUID.' })
  @ApiParam({ name: 'id', description: 'UUID of the resource.', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Resource record with common fields and the fields for its type.', schema: { oneOf: [{ type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, type: { type: 'string', enum: ['insourced'] }, status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED'] }, batchNumber: { type: 'string' }, quantity: { type: 'integer' }, description: { type: 'string', nullable: true }, departmentName: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }, { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, type: { type: 'string', enum: ['outsourced'] }, status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED'] }, batchNumber: { type: 'string' }, quantity: { type: 'integer' }, price: { type: 'number' }, label: { type: 'string' }, vendor: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] } })
  @ApiResponse({ status: 400, description: 'The id path parameter is not a valid UUID.' })
  @ApiResponse({ status: 404, description: 'No resource exists with the supplied UUID.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return toResourceResponse(await this.resourcesService.findOne(id));
  }

@Patch('insourced/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGING_DIRECTOR)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: 'Update an insourced resource' })
@ApiBody({ type: UpdateInsourcedResourceDto })
@ApiResponse({ status: 200, description: 'Updated insourced resource record.', schema: { type: 'object', additionalProperties: true } })
@ApiResponse({ status: 404, description: 'Insourced resource not found.' })
@ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
@ApiForbiddenResponse({ description: 'Only the Managing Director can update resources.' })
async updateInsourced(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateInsourcedResourceDto,
) {
  return toResourceResponse(await this.resourcesService.updateInsourced(id, dto));
}

@Patch('outsourced/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGING_DIRECTOR)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: 'Update an outsourced resource' })
@ApiBody({ type: UpdateOutsourcedResourceDto })
@ApiResponse({ status: 200, description: 'Updated outsourced resource record.', schema: { type: 'object', additionalProperties: true } })
@ApiResponse({ status: 404, description: 'Outsourced resource not found.' })
@ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
@ApiForbiddenResponse({ description: 'Only the Managing Director can update resources.' })
async updateOutsourced(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateOutsourcedResourceDto,
) {
  return toResourceResponse(await this.resourcesService.updateOutsourced(id, dto));
}
}
