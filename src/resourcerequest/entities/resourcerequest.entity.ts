import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Lifecycle: DRAFT -> SUBMITTED -> APPROVED | REJECTED | QUERIED
// A QUERIED request goes back to the team lead, who edits and resubmits it.
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

  // ---- Resource details required by the SRS ----
  @Column({ type: 'text' })
  itemDescription: string;

  @Column()
  manufacturerLabel: string;

  // TypeORM returns decimals as strings, so the transformer converts to number.
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

  // ---- Workflow ----
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.DRAFT })
  status: RequestStatus;

  // ---- Who and where (plain IDs; real relations can come once the
  // organization structure module exists) ----
  @Column()
  requestedBy: string; // team lead's user id, taken from the logged-in user

  @Column()
  lineManagerId: string; // the line manager this request is routed to

  @Column()
  projectId: string; // project the resource supports

  @Column({ nullable: true })
  teamId: string;

  @Column({ nullable: true })
  departmentId: string;

  // ---- Line manager's decision ----
  @Column({ type: 'text', nullable: true })
  reviewNote: string | null; // reason for rejection or the query question

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
