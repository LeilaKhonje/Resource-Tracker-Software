import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Department } from '../departments/entities/department.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(createTeamDto: CreateTeamDto) {
    const { departmentId, ...teamData } = createTeamDto;
    const department = await this.departmentRepository.findOneBy({ id: departmentId });
    if (!department) throw new NotFoundException(`Department with id ${departmentId} not found`);
    const team = this.teamRepository.create({ ...teamData, department });
    return this.teamRepository.save(team);
  }

  async findAll() {
    return this.teamRepository.find();
  }

  async findOne(id: number) {
    const team = await this.teamRepository.findOne({ where: { id } });

    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }

    return team;
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const team = await this.findOne(id);
    const { departmentId, ...teamData } = updateTeamDto;
    Object.assign(team, teamData);
    if (departmentId !== undefined) {
      const department = await this.departmentRepository.findOneBy({ id: departmentId });
      if (!department) throw new NotFoundException(`Department with id ${departmentId} not found`);
      team.department = department;
    }
    return this.teamRepository.save(team);
  }

  async remove(id: number) {
    const team = await this.findOne(id);
    await this.teamRepository.remove(team);
    return team;
  }
}
