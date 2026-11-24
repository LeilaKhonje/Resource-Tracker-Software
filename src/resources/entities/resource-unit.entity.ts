import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ResourceRequest } from '../../resourcerequest/entities/resourcerequest.entity';
import { Resources } from './resources.entity';
import { ResourceAllocation } from './resource-allocation.entity';

export enum ResourceUnitStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  ALLOCATED = 'ALLOCATED',
}

@Entity('resource_units')
@Unique('UQ_resource_units_resource_number', ['resource', 'unitNumber'])
@Unique('UQ_resource_units_asset_tag', ['assetTag'])
export class ResourceUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Resources, (resource) => resource.units, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: Resources;

  @Column({ name: 'unit_number', type: 'int' })
  unitNumber: number;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, nullable: true })
  serialNumber: string | null;

  @Column({ name: 'asset_tag', type: 'varchar', length: 100, nullable: true })
  assetTag: string | null;

  @Column({ type: 'enum', enum: ResourceUnitStatus, default: ResourceUnitStatus.AVAILABLE })
  status: ResourceUnitStatus;

  @ManyToOne(() => ResourceAllocation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_allocation_id' })
  currentAllocation: ResourceAllocation | null;

  @ManyToOne(() => ResourceRequest, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reserved_for_request_id' })
  reservedForRequest: ResourceRequest | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
