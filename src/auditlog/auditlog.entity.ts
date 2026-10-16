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

    @CreateDateColumn()
    createdAt:Date;
}