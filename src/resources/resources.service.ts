import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, ILike, In, IsNull, Repository } from 'typeorm';
import {
  CreateResourceDto,
  isInsourcedResourceInput,
  isOutsourcedResourceInput,
} from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { Resources } from './entities/resources.entity';
import { ResourceType } from './enum/resource-type.enum';
import { ResourceStatus } from './enum/resource-status.enum';
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
import { EmailService } from '../email/email.service';
import { userNameResponse } from '../users/user-name.util';
import { ResourceUnit, ResourceUnitStatus } from './entities/resource-unit.entity';
import { UpdateResourceUnitDto } from './dto/update-resource-unit.dto';

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
    private readonly email: EmailService,
  ) {}

  async createResource(dto: CreateResourceDto): Promise<Resources> {
    if (isInsourcedResourceInput(dto)) {
      const department = await this.findDepartmentByName(dto.departmentName);
      return this.dataSource.transaction(async (manager) => {
        const resource = await manager.getRepository(Resources).save(manager.getRepository(Resources).create({
          name: dto.name.trim(),
          type: ResourceType.INSOURCED,
          description: dto.description.trim(),
          department,
          quantity: dto.quantity,
        }));
        await this.addResourceUnits(manager, resource, dto.quantity);
        resource.units = await manager.getRepository(ResourceUnit).find({
          where: { resource: { id: resource.id } },
          order: { unitNumber: 'ASC' },
        });
        return resource;
      });
    }

    if (isOutsourcedResourceInput(dto)) {
      return this.dataSource.transaction(async (manager) => {
        const resource = await manager.getRepository(Resources).save(manager.getRepository(Resources).create({
          name: dto.name.trim(),
          type: ResourceType.OUTSOURCED,
          price: dto.price,
          label: dto.label.trim(),
          batchNumber: dto.batchNumber.trim(),
          vendor: dto.vendor.trim(),
          quantity: dto.quantity,
        }));
        await this.addResourceUnits(manager, resource, dto.quantity);
        resource.units = await manager.getRepository(ResourceUnit).find({
          where: { resource: { id: resource.id } },
          order: { unitNumber: 'ASC' },
        });
        return resource;
      });
    }

    throw new BadRequestException('Resource type must be insourced or outsourced.');
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

  async getResourceUnits(resourceId: string) {
    await this.findOne(resourceId);
    const units = await this.dataSource.getRepository(ResourceUnit).find({
      where: { resource: { id: resourceId } },
      relations: {
        currentAllocation: { assignedTo: true, allocatedBy: true, team: true, project: true },
        reservedForRequest: true,
      },
      order: { unitNumber: 'ASC' },
    });
    return units.map((unit) => this.resourceUnitResponse(unit));
  }

  async updateResourceUnit(resourceId: string, unitId: string, dto: UpdateResourceUnitDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide a serialNumber or assetTag to update');
    }
    const unit = await this.dataSource.getRepository(ResourceUnit).findOne({
      where: { id: unitId, resource: { id: resourceId } },
    });
    if (!unit) throw new NotFoundException(`Unit ${unitId} not found for resource ${resourceId}`);
    if (dto.serialNumber !== undefined) unit.serialNumber = dto.serialNumber.trim() || null;
    if (dto.assetTag !== undefined) unit.assetTag = dto.assetTag.trim() || null;
    try {
      const repository = this.dataSource.getRepository(ResourceUnit);
      await repository.save(unit);
      const updated = await repository.findOne({
        where: { id: unit.id },
        relations: {
          currentAllocation: { assignedTo: true, allocatedBy: true, team: true, project: true },
          reservedForRequest: true,
        },
      });
      return this.resourceUnitResponse(updated ?? unit);
    } catch (error) {
      const driverError = (error as { driverError?: { code?: string } })?.driverError;
      if (driverError?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('The asset tag is already assigned to another unit');
      }
      throw error;
    }
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
      const availableQuantity = await this.getAvailableQuantity(manager, resourceId);

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
        const approvedQuantity = request.approvedQuantity ?? request.quantity;
        const remainingRequestQuantity = approvedQuantity - Number(previouslyFulfilled?.quantity ?? 0);
        if (dto.quantity > remainingRequestQuantity) {
          throw new ConflictException(`Only ${Math.max(0, remainingRequestQuantity)} units remain to fulfill this request`);
        }
        if (dto.quantity > availableQuantity + Math.max(0, remainingRequestQuantity)) {
          throw new ConflictException(`Only ${Math.max(0, availableQuantity + remainingRequestQuantity)} units are available for allocation`);
        }
      } else if (dto.quantity > availableQuantity) {
        throw new ConflictException(`Only ${Math.max(0, availableQuantity)} units are available`);
      }

      const units = await this.selectUnits(manager, resourceId, dto, request);

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
        quantity: units.length,
        units,
        team: destination.team,
        project: destination.project,
        assignedTo: destination.assignedTo,
        allocatedBy: { id: actorId } as User,
        request,
        status: AllocationStatus.ACTIVE,
        expectedReturnAt,
        returnedAt: null,
      }));
      for (const unit of units) {
        unit.status = ResourceUnitStatus.ALLOCATED;
        unit.currentAllocation = allocation;
        unit.reservedForRequest = null;
      }
      await manager.getRepository(ResourceUnit).save(units);
      await this.refreshResourceStatus(manager, resource);
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
      await this.email.send(destination.assignedTo.email, 'Resource allocated to you', `${allocation.quantity} unit(s) of ${resource.name} have been allocated to you.`);
      return this.allocationNameResponse(await allocationRepo.findOne({
        where: { id: allocation.id },
        relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true, units: true },
      }));
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
        relations: { team: true, project: true, assignedTo: true, units: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!allocation) throw new NotFoundException(`Allocation ${allocationId} not found`);
      if (allocation.status !== AllocationStatus.ACTIVE) {
        throw new ConflictException('Only active allocations can be returned');
      }
      allocation.status = AllocationStatus.RETURNED;
      allocation.returnedAt = new Date();
      await allocationRepo.save(allocation);
      for (const unit of allocation.units) {
        unit.status = ResourceUnitStatus.AVAILABLE;
        unit.currentAllocation = null;
        unit.reservedForRequest = null;
      }
      if (allocation.units.length > 0) await manager.getRepository(ResourceUnit).save(allocation.units);
      await this.refreshResourceStatus(manager, resource);
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
      await this.email.send(allocation.assignedTo.email, 'Resource returned', `${allocation.quantity} unit(s) of ${resource.name} have been marked as returned.`);
      return this.allocationNameResponse(await allocationRepo.findOne({
        where: { id: allocation.id },
        relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true, units: true },
      }));
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
        relations: { team: true, project: true, assignedTo: true, request: true, units: true },
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
        units: oldAllocation.units,
        team: destination.team,
        project: destination.project,
        assignedTo: destination.assignedTo,
        allocatedBy: { id: actorId } as User,
        request: null,
        status: AllocationStatus.ACTIVE,
        expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : oldAllocation.expectedReturnAt,
        returnedAt: null,
      }));
      for (const unit of oldAllocation.units) unit.currentAllocation = newAllocation;
      if (oldAllocation.units.length > 0) await manager.getRepository(ResourceUnit).save(oldAllocation.units);
      await this.refreshResourceStatus(manager, resource);
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
      await this.email.send(destination.assignedTo.email, 'Resource transferred to you', `${oldAllocation.quantity} unit(s) of ${resource.name} have been transferred to you.`);
      return this.allocationNameResponse(await allocationRepo.findOne({
        where: { id: newAllocation.id },
        relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true, units: true },
      }));
    });
  }

  async getActiveAllocations(resourceId: string) {
    await this.findOne(resourceId);
    const allocations = await this.dataSource.getRepository(ResourceAllocation).find({
      where: { resource: { id: resourceId }, status: AllocationStatus.ACTIVE },
      relations: { resource: true, team: true, project: true, assignedTo: true, allocatedBy: true, request: true, units: true },
      order: { allocatedAt: 'DESC' },
    });
    return allocations.map((allocation) => this.allocationNameResponse(allocation));
  }

  async getResourceMovements(resourceId: string) {
    await this.findOne(resourceId);
    const movements = await this.dataSource.getRepository(ResourceMovement).find({
      where: { resource: { id: resourceId } },
      relations: { allocation: { units: true }, performedBy: true },
      order: { occurredAt: 'ASC' },
    });
    return movements.map((movement) => ({
      ...movement,
      allocation: movement.allocation ? this.allocationNameResponse(movement.allocation) : movement.allocation,
      performedBy: movement.performedBy ? userNameResponse(movement.performedBy) : null,
    }));
  }

  private allocationNameResponse<T extends ResourceAllocation | null>(allocation: T) {
    if (!allocation) return allocation;
    return {
      ...allocation,
      assignedTo: allocation.assignedTo ? userNameResponse(allocation.assignedTo) : null,
      allocatedBy: allocation.allocatedBy ? userNameResponse(allocation.allocatedBy) : null,
    };
  }

  private resourceUnitResponse(unit: ResourceUnit) {
    return {
      id: unit.id,
      unitNumber: unit.unitNumber,
      serialNumber: unit.serialNumber,
      assetTag: unit.assetTag,
      status: unit.status,
      reservedForRequestId: unit.reservedForRequest?.id ?? null,
      currentAllocation: unit.currentAllocation
        ? this.allocationNameResponse(unit.currentAllocation)
        : null,
    };
  }

  private async addResourceUnits(manager: EntityManager, resource: Resources, quantity: number) {
    const repository = manager.getRepository(ResourceUnit);
    const lastUnit = await repository.findOne({
      where: { resource: { id: resource.id } },
      select: { unitNumber: true },
      order: { unitNumber: 'DESC' },
    });
    const firstNumber = (lastUnit?.unitNumber ?? 0) + 1;
    const units = repository.create(Array.from({ length: quantity }, (_, index) => ({
      resource,
      unitNumber: firstNumber + index,
      serialNumber: null,
      assetTag: null,
      status: ResourceUnitStatus.AVAILABLE,
      currentAllocation: null,
      reservedForRequest: null,
    })));
    await repository.save(units);
  }

  private async selectUnits(
    manager: EntityManager,
    resourceId: string,
    dto: CreateResourceAllocationDto,
    request: ResourceRequest | null,
  ) {
    const repository = manager.getRepository(ResourceUnit);
    const status = request ? ResourceUnitStatus.RESERVED : ResourceUnitStatus.AVAILABLE;
    const baseWhere = {
      resource: { id: resourceId },
      status,
      reservedForRequest: request ? { id: request.id } : IsNull(),
    };
    let units: ResourceUnit[];
    if (dto.unitIds) {
      if (dto.unitIds.length !== dto.quantity) {
        throw new BadRequestException('unitIds must contain exactly quantity unit IDs');
      }
      units = await repository.find({
        where: { ...baseWhere, id: In(dto.unitIds) },
        order: { unitNumber: 'ASC' },
      });
      if (units.length !== dto.quantity) {
        throw new ConflictException('One or more selected units are unavailable or not eligible for this request');
      }
    } else {
      units = await repository.find({
        where: baseWhere,
        order: { unitNumber: 'ASC' },
        take: dto.quantity,
      });
      if (units.length < dto.quantity) {
        throw new ConflictException(`Only ${units.length} eligible units are available`);
      }
    }
    return units;
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

  async updateResource(id: string, dto: UpdateResourceDto): Promise<Resources> {
    return this.dataSource.transaction(async (manager) => {
      const resource = await manager.getRepository(Resources).findOne({
        where: { id },
        relations: { department: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!resource) {
        throw new NotFoundException(`Resource with id "${id}" not found`);
      }

      if (resource.type === ResourceType.INSOURCED) {
        this.assertFieldsAbsent(dto, ['price', 'label', 'batchNumber', 'vendor']);
        if (dto.departmentName !== undefined) {
          resource.department = await this.findDepartmentByName(dto.departmentName);
        }
      } else {
        this.assertFieldsAbsent(dto, ['description', 'departmentName']);
      }

      for (const [field, value] of Object.entries(dto)) {
        if (field !== 'departmentName' && value !== undefined) {
          Object.assign(resource, { [field]: value });
        }
      }
      await this.syncResourceUnits(manager, resource);
      await this.refreshResourceStatus(manager, resource);
      return manager.getRepository(Resources).save(resource);
    });
  }

  private async syncResourceUnits(manager: EntityManager, resource: Resources) {
    const repository = manager.getRepository(ResourceUnit);
    const units = await repository.find({
      where: { resource: { id: resource.id } },
      order: { unitNumber: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
    const occupiedUnits = units.filter((unit) => unit.status !== ResourceUnitStatus.AVAILABLE).length;
    if (resource.quantity < occupiedUnits) {
      throw new ConflictException(
        `Quantity cannot be lower than the ${occupiedUnits} units currently reserved or allocated`,
      );
    }
    if (units.length < resource.quantity) {
      await this.addResourceUnits(manager, resource, resource.quantity - units.length);
      return;
    }
    if (units.length > resource.quantity) {
      const availableToRemove = units
        .filter((unit) => unit.status === ResourceUnitStatus.AVAILABLE)
        .slice(0, units.length - resource.quantity);
      if (availableToRemove.length !== units.length - resource.quantity) {
        throw new ConflictException('Only unreserved, unallocated units can be removed from the resource quantity');
      }
      await repository.remove(availableToRemove);
    }
  }

  private async getAvailableQuantity(manager: EntityManager, resourceId: string) {
    const resource = await manager.getRepository(Resources).findOne({ where: { id: resourceId } });
    if (!resource) throw new NotFoundException(`Resource with id "${resourceId}" not found`);
    return manager.getRepository(ResourceUnit).count({
      where: { resource: { id: resourceId }, status: ResourceUnitStatus.AVAILABLE },
    });
  }

  private async refreshResourceStatus(manager: EntityManager, resource: Resources) {
    const availableQuantity = await this.getAvailableQuantity(manager, resource.id);
    resource.status = availableQuantity > 0 ? ResourceStatus.AVAILABLE : ResourceStatus.ASSIGNED;
    await manager.getRepository(Resources).save(resource);
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
