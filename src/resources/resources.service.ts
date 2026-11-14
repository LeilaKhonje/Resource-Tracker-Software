import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, ILike, MoreThan, Repository } from 'typeorm';
import { CreateInsourcedResourceDto } from './dto/create-insourced-resource.dto';
import { CreateOutsourcedResourceDto } from './dto/create-outsourced-resource.dto';
import { UpdateInsourcedResourceDto } from './dto/update-insourced-resource.dto';
import { UpdateOutsourcedResourceDto } from './dto/update-outsourced-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { Resources } from './entities/resources.entity';
import { ResourceType } from './enum/resource-type.enum';
import { Department } from '../departments/entities/department.entity';
import { ResourceAllocation, AllocationStatus } from './entities/resource-allocation.entity';
import { ResourceMovement, ResourceMovementType } from './entities/resource-movement.entity';
import { CreateResourceAllocationDto } from './dto/create-resource-allocation.dto';
import { TransferResourceAllocationDto } from './dto/transfer-resource-allocation.dto';
import { ResourceRequest, RequestStatus } from '../resourcerequest/entities/resourcerequest.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';

const INSOURCED_FIELDS = ['description', 'departmentName'] as const;
const OUTSOURCED_FIELDS = ['price', 'label', 'batchNumber', 'vendor'] as const;

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resources)
    private readonly resourcesRepository: Repository<Resources>,
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
    private readonly dataSource: DataSource,
  ) {}

  async createInsourced(dto: CreateInsourcedResourceDto): Promise<Resources>{
    const department = await this.findDepartmentByName(dto.departmentName);
    const resource = this.resourcesRepository.create({
      name: dto.name.trim(),
      type: ResourceType.INSOURCED,
      description: dto.description.trim(),
      department,
      quantity: dto.quantity,
    });
    return this.resourcesRepository.save(resource);
  }
  async createOutsourced(dto: CreateOutsourcedResourceDto): Promise<Resources> {
    const resource = this.resourcesRepository.create({
      name: dto.name.trim(),
      type: ResourceType.OUTSOURCED,
      price: dto.price,
      label: dto.label.trim(),
      batchNumber: dto.batchNumber.trim(),
      vendor: dto.vendor.trim(),
      quantity: dto.quantity,
    });
    return this.resourcesRepository.save(resource);
  } 

  async findAll(query: QueryResourceDto): Promise<Resources[]> {
    const where: FindOptionsWhere<Resources> = {};
    if (query.name) where.name = ILike(`%${query.name}%`);
    if (query.type) where.type = query.type;

    return this.resourcesRepository.find({
      where,
      relations: { department: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findInsourced(query: QueryResourceDto): Promise<Resources[]>{
    return this.findAll({...query, type: ResourceType.INSOURCED});
  }

  async findOutsourced(query: QueryResourceDto): Promise<Resources[]>{
    return this.findAll({... query, type: ResourceType.OUTSOURCED});
  }

  async getAvailableResourcesByType() {
    const resources = await this.resourcesRepository.find({
      where: { quantity: MoreThan(0) },
      relations: { department: true },
      order: { createdAt: 'DESC' },
    });

    const allocationTotals = await this.dataSource
      .getRepository(ResourceAllocation)
      .createQueryBuilder('allocation')
      .select('allocation.resource_id', 'resourceId')
      .addSelect('SUM(allocation.quantity)', 'allocatedQuantity')
      .where('allocation.status = :status', { status: AllocationStatus.ACTIVE })
      .groupBy('allocation.resource_id')
      .getRawMany<{ resourceId: string; allocatedQuantity: string }>();
    const allocatedByResource = new Map(
      allocationTotals.map((row) => [row.resourceId, Number(row.allocatedQuantity)]),
    );

    return Object.values(ResourceType).map((type) => {
      const categoryResources = resources.filter(
        (resource) => resource.type === type,
      );
      return {
        type,
        availableQuantity: categoryResources.reduce((total, resource) => {
          return total + Math.max(0, resource.quantity - (allocatedByResource.get(resource.id) ?? 0));
        }, 0),
        resources: categoryResources.map((resource) => ({
          resource,
          availableQuantity: Math.max(
            0,
            resource.quantity - (allocatedByResource.get(resource.id) ?? 0),
          ),
        })),
      };
    });
  }

  async createAllocation(resourceId: string, dto: CreateResourceAllocationDto, actorId: string) {
    return this.dataSource.transaction(async (manager) => {
      const resource = await manager.getRepository(Resources).findOne({
        where: { id: resourceId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!resource) throw new NotFoundException(`Resource with id "${resourceId}" not found`);

      const destination = await this.validateDestination(
        manager,
        dto.teamId,
        dto.projectId,
        dto.assignedToUserId,
      );
      const activeQuantity = await this.getActiveAllocationQuantity(manager, resourceId);
      const availableQuantity = resource.quantity - activeQuantity;
      if (dto.quantity > availableQuantity) {
        throw new ConflictException(`Only ${Math.max(0, availableQuantity)} units are available`);
      }

      let request: ResourceRequest | null = null;
      if (dto.requestId) {
        request = await manager.getRepository(ResourceRequest).findOne({
          where: { id: dto.requestId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!request) throw new NotFoundException(`Request ${dto.requestId} not found`);
        if (request.status !== RequestStatus.APPROVED || request.lineManagerId !== actorId) {
          throw new ForbiddenException('Only the assigned Line Manager can allocate against an approved request');
        }
        if (request.teamId !== String(dto.teamId) || request.projectId !== String(dto.projectId)) {
          throw new BadRequestException('Allocation team and project must match the approved request');
        }
        const previouslyFulfilled = await manager.getRepository(ResourceAllocation)
          .createQueryBuilder('allocation')
          .where('allocation.request_id = :requestId', { requestId: request.id })
          .andWhere('allocation.status != :transferred', { transferred: AllocationStatus.TRANSFERRED })
          .select('COALESCE(SUM(allocation.quantity), 0)', 'quantity')
          .getRawOne<{ quantity: string }>();
        const remainingRequestQuantity = request.quantity - Number(previouslyFulfilled?.quantity ?? 0);
        if (dto.quantity > remainingRequestQuantity) {
          throw new ConflictException(`Only ${Math.max(0, remainingRequestQuantity)} units remain to fulfill this request`);
        }
      }

      const expectedReturnAt = dto.expectedReturnAt
        ? new Date(dto.expectedReturnAt)
        : request?.expectedDurationDays
          ? new Date(
              Date.now() +
                request.expectedDurationDays * 24 * 60 * 60 * 1000,
            )
          : null;

      const allocationRepo = manager.getRepository(ResourceAllocation);
      const allocation = await allocationRepo.save(allocationRepo.create({
        resource,
        quantity: dto.quantity,
        team: destination.team,
        project: destination.project,
        assignedTo: destination.assignedTo,
        allocatedBy: { id: actorId } as User,
        request,
        status: AllocationStatus.ACTIVE,
        expectedReturnAt,
        returnedAt: null,
      }));
      await this.recordMovement(manager, {
        resource,
        allocation,
        movementType: ResourceMovementType.ALLOCATED,
        quantity: allocation.quantity,
        toUserId: destination.assignedTo.id,
        toTeamId: destination.team.id,
        toProjectId: destination.project.id,
        performedBy: { id: actorId } as User,
      });
      return allocationRepo.findOne({
        where: { id: allocation.id },
        relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true },
      });
    });
  }

  async returnAllocation(allocationId: string, actorId: string, note?: string) {
    const existing = await this.dataSource.getRepository(ResourceAllocation).findOne({
      where: { id: allocationId },
      relations: { resource: true },
    });
    if (!existing) throw new NotFoundException(`Allocation ${allocationId} not found`);

    return this.dataSource.transaction(async (manager) => {
      const resource = await manager.getRepository(Resources).findOne({
        where: { id: existing.resource.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!resource) throw new NotFoundException(`Resource ${existing.resource.id} not found`);
      const allocationRepo = manager.getRepository(ResourceAllocation);
      const allocation = await allocationRepo.findOne({
        where: { id: allocationId },
        relations: { team: true, project: true, assignedTo: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!allocation) throw new NotFoundException(`Allocation ${allocationId} not found`);
      if (allocation.status !== AllocationStatus.ACTIVE) {
        throw new ConflictException('Only active allocations can be returned');
      }
      allocation.status = AllocationStatus.RETURNED;
      allocation.returnedAt = new Date();
      await allocationRepo.save(allocation);
      await this.recordMovement(manager, {
        resource,
        allocation,
        movementType: ResourceMovementType.RETURNED,
        quantity: allocation.quantity,
        fromUserId: allocation.assignedTo.id,
        fromTeamId: allocation.team.id,
        fromProjectId: allocation.project.id,
        performedBy: { id: actorId } as User,
        note,
      });
      return allocationRepo.findOne({
        where: { id: allocation.id },
        relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true },
      });
    });
  }

  async transferAllocation(allocationId: string, dto: TransferResourceAllocationDto, actorId: string) {
    const existing = await this.dataSource.getRepository(ResourceAllocation).findOne({
      where: { id: allocationId },
      relations: { resource: true },
    });
    if (!existing) throw new NotFoundException(`Allocation ${allocationId} not found`);

    return this.dataSource.transaction(async (manager) => {
      const resource = await manager.getRepository(Resources).findOne({
        where: { id: existing.resource.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!resource) throw new NotFoundException(`Resource ${existing.resource.id} not found`);
      const allocationRepo = manager.getRepository(ResourceAllocation);
      const oldAllocation = await allocationRepo.findOne({
        where: { id: allocationId },
        relations: { team: true, project: true, assignedTo: true, request: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!oldAllocation) throw new NotFoundException(`Allocation ${allocationId} not found`);
      if (oldAllocation.status !== AllocationStatus.ACTIVE) {
        throw new ConflictException('Only active allocations can be transferred');
      }

      const destination = await this.validateDestination(manager, dto.teamId, dto.projectId, dto.assignedToUserId);
      oldAllocation.status = AllocationStatus.TRANSFERRED;
      oldAllocation.returnedAt = new Date();
      await allocationRepo.save(oldAllocation);
      const newAllocation = await allocationRepo.save(allocationRepo.create({
        resource,
        quantity: oldAllocation.quantity,
        team: destination.team,
        project: destination.project,
        assignedTo: destination.assignedTo,
        allocatedBy: { id: actorId } as User,
        request: null,
        status: AllocationStatus.ACTIVE,
        expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : oldAllocation.expectedReturnAt,
        returnedAt: null,
      }));
      await this.recordMovement(manager, {
        resource,
        allocation: newAllocation,
        movementType: ResourceMovementType.TRANSFERRED,
        quantity: oldAllocation.quantity,
        fromUserId: oldAllocation.assignedTo.id,
        fromTeamId: oldAllocation.team.id,
        fromProjectId: oldAllocation.project.id,
        toUserId: destination.assignedTo.id,
        toTeamId: destination.team.id,
        toProjectId: destination.project.id,
        performedBy: { id: actorId } as User,
        note: dto.note,
      });
      return allocationRepo.findOne({
        where: { id: newAllocation.id },
        relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true },
      });
    });
  }

  async getActiveAllocations(resourceId: string) {
    await this.findOne(resourceId);
    return this.dataSource.getRepository(ResourceAllocation).find({
      where: { resource: { id: resourceId }, status: AllocationStatus.ACTIVE },
      relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true },
      order: { allocatedAt: 'DESC' },
    });
  }

  async getResourceMovements(resourceId: string) {
    await this.findOne(resourceId);
    return this.dataSource.getRepository(ResourceMovement).find({
      where: { resource: { id: resourceId } },
      relations: { allocation: true, performedBy: true },
      order: { occurredAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Resources> {
    const resource = await this.resourcesRepository.findOne({
      where: { id },
      relations: { department: true },
    });
    if (!resource) {
      throw new NotFoundException(`Resource with id "${id}" not found`);
    }
    return resource;
  }

 async updateInsourced(id: string, dto: UpdateInsourcedResourceDto): Promise<Resources> {
  return this.dataSource.transaction(async (manager) => {
    const resource = await this.findLockedByType(manager, id, ResourceType.INSOURCED);
    const { departmentName, ...changes } = dto;
    if (departmentName !== undefined) {
      resource.department = await this.findDepartmentByName(departmentName);
    }
    Object.assign(resource, changes);
    await this.assertQuantityCoversAllocations(manager, resource);
    return manager.getRepository(Resources).save(resource);
  });
}

async updateOutsourced(id: string, dto: UpdateOutsourcedResourceDto): Promise<Resources> {
  return this.dataSource.transaction(async (manager) => {
    const resource = await this.findLockedByType(manager, id, ResourceType.OUTSOURCED);
    Object.assign(resource, dto);
    await this.assertQuantityCoversAllocations(manager, resource);
    return manager.getRepository(Resources).save(resource);
  });
}

private async findLockedByType(manager: EntityManager, id: string, type: ResourceType) {
  const resource = await manager.getRepository(Resources).findOne({
    where: { id },
    relations: { department: true },
    lock: { mode: 'pessimistic_write' },
  });
  if (!resource) {
    throw new NotFoundException(`Resource with id "${id}" not found`);
  }
  if (resource.type !== type) {
    throw new BadRequestException(
      `Resource "${id}" is ${resource.type}; use the ${resource.type} endpoint to update it`,
    );
  }
  return resource;
}

private async assertQuantityCoversAllocations(manager: EntityManager, resource: Resources) {
  const active = await this.getActiveAllocationQuantity(manager, resource.id);
  if (resource.quantity < active) {
    throw new ConflictException(
      `Quantity cannot be lower than the ${active} units currently allocated`,
    );
  }
}

  private async getActiveAllocationQuantity(manager: EntityManager, resourceId: string) {
    const result = await manager.getRepository(ResourceAllocation)
      .createQueryBuilder('allocation')
      .where('allocation.resource_id = :resourceId', { resourceId })
      .andWhere('allocation.status = :status', { status: AllocationStatus.ACTIVE })
      .select('COALESCE(SUM(allocation.quantity), 0)', 'quantity')
      .getRawOne<{ quantity: string }>();
    return Number(result?.quantity ?? 0);
  }

  private async validateDestination(
    manager: EntityManager,
    teamId: number,
    projectId: number,
    assignedToUserId: string,
  ) {
    const [team, project, assignedTo] = await Promise.all([
      manager.getRepository(Team).findOne({
        where: { id: teamId },
        relations: { department: true },
      }),
      manager.getRepository(Project).findOne({
        where: { id: projectId },
        relations: { teams: true },
      }),
      manager.getRepository(User).findOne({
        where: { id: assignedToUserId },
        relations: { team: true },
      }),
    ]);

    if (!team) throw new NotFoundException(`Team ${teamId} not found`);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (!assignedTo) throw new NotFoundException(`User ${assignedToUserId} not found`);
    if (!assignedTo.isActive) {
      throw new BadRequestException('Resources can only be assigned to active users');
    }
    if (assignedTo.team?.id !== team.id) {
      throw new BadRequestException('The assigned user must belong to the selected team');
    }
    if (!project.teams?.some((projectTeam) => projectTeam.id === team.id)) {
      throw new BadRequestException('The project must be assigned to the selected team');
    }
    return { team, project, assignedTo };
  }

  private async recordMovement(
    manager: EntityManager,
    movement: Partial<ResourceMovement>,
  ) {
    const repository = manager.getRepository(ResourceMovement);
    await repository.save(repository.create(movement));
  }

  private assertFieldsAbsent(dto: object, fields: readonly string[]) {
    const supplied = fields.filter(
      (field) => (dto as Record<string, unknown>)[field] !== undefined,
    );
    if (supplied.length > 0) {
      throw new BadRequestException(
        `Field(s) ${supplied.join(', ')} are not valid for this resource type`,
      );
    }
  }

  private async findDepartmentByName(name: string): Promise<Department> {
    this.assertNonEmptyString(name, 'departmentName');
    const departments = await this.departmentsRepository.find({
      where: { name: name.trim() },
      take: 2,
    });
    if (departments.length === 0) {
      throw new NotFoundException(`Department '${name}' not found`);
    }
    if (departments.length > 1) {
      throw new BadRequestException(
        `Department name '${name}' is ambiguous; department names must be unique`,
      );
    }
    return departments[0];
  }

  private assertQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be an integer of at least 1');
    }
  }

  private assertOutsourcedFields(resource: {
    price?: number | null;
    vendor?: string | null;
    label?: string | null;
    batchNumber?: string | null;
  }) {
    if (
      typeof resource.price !== 'number' ||
      !Number.isFinite(resource.price) ||
      resource.price < 0 ||
      Math.abs(resource.price - Number(resource.price.toFixed(2))) > 1e-9
    ) {
      throw new BadRequestException(
        'price is required, non-negative, and limited to two decimal places for outsourced resources',
      );
    }
    this.assertNonEmptyString(resource.vendor, 'vendor');
    this.assertNonEmptyString(resource.label, 'label');
    this.assertNonEmptyString(resource.batchNumber, 'batchNumber');
  }

  private assertNonEmptyString(value: unknown, field: string) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${field} must be a non-empty string`);
    }
  }
}
