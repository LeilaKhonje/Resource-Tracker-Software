import {Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { Team } from '../teams/entities/team.entity';
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

  @Column({ name: 'phone_number', type: 'varchar', length: 30, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ name: 'preferred_pronoun', type: 'varchar', length: 4, nullable: true })
  preferredPronoun: string | null;

  @Column({default: true})
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: true,
  })
  role: UserRole | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_id' })
  team: Team | null;

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
