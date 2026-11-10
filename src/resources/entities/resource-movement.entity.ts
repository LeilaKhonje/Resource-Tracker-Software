import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ResourceAllocation } from './resource-allocation.entity';
import { Resources } from './resources.entity';
import { User } from '../../users/user.entity';

export enum ResourceMovementType {
  ALLOCATED = 'ALLOCATED',
  TRANSFERRED = 'TRANSFERRED',
  RETURNED = 'RETURNED',
}

@Entity('resource_movements')
export class ResourceMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Resources, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'resource_id' })
  resource: Resources;

  @ManyToOne(() => ResourceAllocation, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'allocation_id' })
  allocation: ResourceAllocation;

  @Column({ type: 'enum', enum: ResourceMovementType })
  movementType: ResourceMovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'from_user_id' })
  fromUserId: string | null;

  @Column({ type: 'int', nullable: true, name: 'from_team_id' })
  fromTeamId: number | null;

  @Column({ type: 'int', nullable: true, name: 'from_project_id' })
  fromProjectId: number | null;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'to_user_id' })
  toUserId: string | null;

  @Column({ type: 'int', nullable: true, name: 'to_team_id' })
  toTeamId: number | null;

  @Column({ type: 'int', nullable: true, name: 'to_project_id' })
  toProjectId: number | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'performed_by_user_id' })
  performedBy: User;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
