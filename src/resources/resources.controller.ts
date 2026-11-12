import { toResourceResponse } from './resource-response';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { CreateResourceAllocationDto } from './dto/create-resource-allocation.dto';
import { TransferResourceAllocationDto } from './dto/transfer-resource-allocation.dto';
import { ReturnResourceAllocationDto } from './dto/return-resource-allocation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
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

@ApiTags('Resources')
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
    summary: 'Create a resource (Managing Director only)',
    description:
      'Creates an insourced or outsourced resource. Insourced resources require a description and the name of an existing department, and cannot include outsourced fields. Outsourced resources require price, label, batchNumber, and vendor, and cannot include insourced fields. Quantity must be at least 1.',
  })
  @ApiBody({ type: CreateResourceDto })
  @ApiResponse({ status: 201, description: 'Resource created. The response includes common fields and only the fields for its resource type.' })
  @ApiResponse({ status: 400, description: 'Invalid or conflicting type-specific fields, quantity below 1, or invalid price.' })
  @ApiResponse({ status: 404, description: 'The named department does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
  @ApiForbiddenResponse({ description: 'Only the Managing Director can create resources.' })
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

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LINE_MANAGER)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List available resources and quantities by type (Line Manager only)',
    description:
      'Returns resource records with positive available quantity, grouped by type. Active allocations are deducted from recorded quantities.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Resource groups for insourced and outsourced resources, including each group’s total available quantity.',
  })
  @ApiUnauthorizedResponse({ description: 'A valid bearer access token is required.' })
  @ApiForbiddenResponse({ description: 'Only Line Managers can view available resources.' })
  async getAvailableResources() {
    const groups = await this.resourcesService.getAvailableResourcesByType();
    const categories = groups.map(({ resources, ...group }) => ({
      ...group,
      resources: resources
        .filter(({ availableQuantity }) => availableQuantity > 0)
        .map(({ resource, availableQuantity }) => ({
          ...toResourceResponse(resource),
          availableQuantity,
        })),
    }));
    return {
      totalAvailableQuantity: categories.reduce(
        (total, category) => total + category.availableQuantity,
        0,
      ),
      categories,
    };
  }

  @Post(':id/allocations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LINE_MANAGER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Allocate available resource units to a team member (Line Manager only)' })
  @ApiParam({ name: 'id', description: 'Resource UUID', format: 'uuid' })
  @ApiBody({ type: CreateResourceAllocationDto })
  @ApiResponse({ status: 201, description: 'Created active allocation and recorded an allocation movement.' })
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
  @ApiResponse({ status: 200, description: 'Active assignments, including current user, team, project, and return deadline.' })
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
  @ApiResponse({ status: 200, description: 'Chronological allocation, transfer, and return events.' })
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
  @ApiResponse({ status: 200, description: 'Allocation marked returned and movement event recorded.' })
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
  @ApiResponse({ status: 200, description: 'Previous assignment closed, new assignment created, and transfer movement recorded.' })
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
