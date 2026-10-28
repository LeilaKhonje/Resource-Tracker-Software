import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';


export enum RequestStatus {
  DRAFT = 'DRAFT',
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

  @Column()
  manufacturerLabel: string;

  
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column()
  batchNumber: string;

  @Column()
  vendor: string;

  @Column({ default: 1 })
  quantity: number;

  
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.DRAFT })
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

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}