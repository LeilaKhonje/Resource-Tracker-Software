import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('resource_requests')
export class ResourceRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  itemDescription: string;

  @Column({ length: 255, nullable: true })
  manufacturerLabel: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ length: 100, nullable: true })
  batchNumber: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ length: 255, nullable: true })
  vendor: string;

  @Column({ type: 'int', nullable: true })
  departmentId: number;

  @Column({ type: 'int', nullable: true })
  teamId: number;

  @Column({ length: 255, nullable: true })
  project: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}