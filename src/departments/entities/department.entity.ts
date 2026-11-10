import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index('UQ_department_name', ['name'], { unique: true })
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  code?: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  description: string;
}
