import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';

export enum AllocationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ALLOCATED = 'allocated',
    QUERIED = 'queried',
}

@Entity('resource_allocations')
export class ResourceAllocation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    resourceName: string;

    @Column({nullable: true})
    resourceType: string;

    @Column()
    quantity: number;

    @Column({ nullable: true })
    reason: string;

    @Column({ type: 'enum', enum: AllocationStatus, default: AllocationStatus.PENDING })
    status: AllocationStatus;

    @Column()
    requestedById: number;
    
    @Column({ nullable: true })
    requestedByName: string;

    @Column({ nullable: true })
    departmentId: number;

    @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'department_id' })
    department: Department;

    @Column({ nullable: true })
    teamId: number;
    
    @Column({ nullable: true })
    approvedById: number;
    
    @Column({ nullable: true, type: 'text' })
    rejectionReason: string;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    StartDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    EndDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    returnedAt: Date;

    @Column({ nullable: true })
    currentlyHeldBy: String;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}