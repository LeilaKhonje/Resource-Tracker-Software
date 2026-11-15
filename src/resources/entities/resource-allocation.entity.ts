import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Resources } from './resources.entity';
import { Team } from '../../teams/entities/team.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/user.entity';
import { ResourceRequest } from '../../resourcerequest/entities/resourcerequest.entity';

export enum AllocationStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  TRANSFERRED = 'TRANSFERRED',
}

@Entity('resource_allocations')
export class ResourceAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Resources, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'resource_id' })
  resource: Resources;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => Project, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assignedTo: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'allocated_by_user_id' })
  allocatedBy: User;

  @ManyToOne(() => ResourceRequest, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'request_id' })
  request: ResourceRequest | null;

  @Column({ type: 'enum', enum: AllocationStatus, default: AllocationStatus.ACTIVE })
  status: AllocationStatus;

  @CreateDateColumn({ name: 'allocated_at' })
  allocatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expected_return_at' })
  expectedReturnAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'returned_at' })
  returnedAt: Date | null;
}
