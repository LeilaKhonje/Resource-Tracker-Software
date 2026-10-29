import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-departments.dto';
import { User } from '../users/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const department = this.departmentRepository.create(createDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async findAll() {
    return this.departmentRepository.find();
  }

  async findOne(id: number) {
    const department = await this.departmentRepository.findOne({ where: { id } });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    return department;
  }

  async findUsers(id: number) {
    await this.findOne(id);
    return this.userRepository.find({ where: { department: { id } } });
  }

  async findTeams(id: number) {
    await this.findOne(id);
    return this.teamRepository.find({ where: { department: { id } } });
  }

  async findProjects(id: number) {
    await this.findOne(id);
    return this.projectRepository.find({
      where: { teams: { department: { id } } },
      relations: { teams: true },
    });
  }

  async findTeamProjects(departmentId: number, teamId: number) {
    await this.findOne(departmentId);
    const team = await this.teamRepository.findOne({
      where: { id: teamId, department: { id: departmentId } },
    });

    if (!team) {
      throw new NotFoundException(
        `Team with id ${teamId} not found in department ${departmentId}`,
      );
    }

    return this.projectRepository.find({
      where: { teams: { id: teamId } },
      relations: { teams: true },
    });
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.findOne(id);
    Object.assign(department, updateDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async remove(id: number) {
    const department = await this.findOne(id);
    await this.departmentRepository.remove(department);
    return department;
  }
}