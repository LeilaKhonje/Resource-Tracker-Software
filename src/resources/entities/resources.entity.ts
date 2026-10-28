import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ResourceType } from '../enum/resource-type.enum';

@Entity('resources')
export class Resources {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 150})
    name: string;

    @Column({type: 'enum', enum: ResourceType })
    type: ResourceType;

    @Column({type: 'text', nullable: true})
    description: string | null;

    @Column({type: 'varchar', length: 100, nullable: true})
    department: string | null;

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

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;
}