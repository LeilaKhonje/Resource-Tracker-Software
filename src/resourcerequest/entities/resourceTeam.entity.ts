import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RequestTeam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  teamLeadId: string;
}