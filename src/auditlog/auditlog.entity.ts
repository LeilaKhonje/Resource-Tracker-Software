import{Entity,PrimaryGeneratedColumn,Column,CreateDateColumn} from 'typeorm';

@Entity('audit_logs')
export class AuditLog{
    @PrimaryGeneratedColumn()
    id:number;

    @Column({length : 100})
    actionType:string;

    @Column({length : 100})
    entityType:string;

    @Column({type: 'text',nullable:true})
    details:string | null;

    // Resource request workflow audit fields. These are nullable so existing
    // generic audit records can continue using userId/entityId/details.
    @Column({ type: 'varchar', length: 36, nullable: true })
    requestId: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    action: string | null;

    @Column({ type: 'varchar', length: 36, nullable: true })
    performedBy: string | null;

    @Column({ type: 'text', nullable: true })
    note: string | null;

    @CreateDateColumn()
    createdAt:Date;
}
