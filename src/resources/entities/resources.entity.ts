import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ResourceType } from '../enum/resource-type.enum';
import { ResourceStatus } from '../enum/resource-status.enum';
import { Department } from '../../departments/entities/department.entity';
import { ResourceUnit } from './resource-unit.entity';

@Entity('resources')
export class Resources {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 150})
    name: string;

    @Column({type: 'enum', enum: ResourceType })
    type: ResourceType;

    @Column({ type: 'enum', enum: ResourceStatus, default: ResourceStatus.AVAILABLE })
    status: ResourceStatus;

    @Column({type: 'text', nullable: true})
    description: string | null;

    @ManyToOne(() => Department, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'department_id' })
    department: Department | null;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value?: number | null) => value,
            from: (value?: string | null) => (value == null ? null : parseFloat(value)), 
        },
    })
    price: number | null;

    @Column({ type: 'varchar', length: 100, nullable: true})
    label: string | null;

    @Column({name: 'batch_number', type: 'varchar', length: 100, nullable: true})
    batchNumber: string | null;

    @Column({type: 'varchar', length: 150, nullable: true})
    vendor: string | null;

    @Column({ type: 'int', default: 1 })
    quantity: number;

    @OneToMany(() => ResourceUnit, (unit) => unit.resource)
    units: ResourceUnit[];

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;
}
