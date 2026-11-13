import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';



export enum RequestStatus {
  SUBMITTED = 'SUBMITTED',
  QUERIED = 'QUERIED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity()
export class ResourceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  
  @Column({ type: 'text' })
  itemDescription: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturerLabel: string | null;

  
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value === null ? null : parseFloat(value),
    },
  })
  price: number | null;

  @Column()
  batchNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor: string | null;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'int', nullable: true })
  expectedDurationDays: number | null;

  
    @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.SUBMITTED })
  status: RequestStatus;

  
  @Column()
  requestedBy: string; 

  @Column()
  lineManagerId: string; 

  @Column()
  projectId: string; 

  @Column({ nullable: true })
  teamId: string;

  @Column({ nullable: true })
  departmentId: string;

 @Column({ type: 'text', nullable: true })
reviewNote: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewedBy: string | null;

@Column({ type: 'timestamp', nullable: true })
reviewedAt: Date | null;

@Column({ type: 'timestamp', nullable: true })
submittedAt: Date | null;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
