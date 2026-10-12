import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 120 })
  fullName: string;

  @Column({ unique: true, length: 254 })
  email: string;

  @Column({ name: 'password_hash', length: 128, select: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: true,
  })
  role: UserRole | null;

  @Index('IDX_users_single_managing_director', { unique: true })
  @Column({
    name: 'managing_director_unique_role',
    type: 'varchar',
    length: 32,
    nullable: true,
    asExpression:
      "CASE WHEN role = 'managing_director' THEN 'managing_director' ELSE NULL END",
    generatedType: 'VIRTUAL',
    select: false,
  })
  managingDirectorUniqueRole: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
