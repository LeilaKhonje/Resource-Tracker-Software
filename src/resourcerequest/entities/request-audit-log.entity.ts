import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// One row per action on a resource request. Insert-only.
// Separate from the group's audit_logs table so the two never clash.
@Entity('resource_request_audit')
export class RequestAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requestId: string;

  @Column()
  action: string; // CREATED, SUBMITTED, APPROVED, ...

  @Column()
  performedBy: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}