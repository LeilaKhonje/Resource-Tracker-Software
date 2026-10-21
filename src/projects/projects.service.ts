import {Injectable, NotFoundException, UnprocessableEntityException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async create(createProjectDto: CreateProjectDto) {
    const { teamIds = [], ...projectDetails } = createProjectDto;
    const teams = await this.findTeams(teamIds);
    const project = this.projectRepository.create({
      ...projectDetails,
      teams,
    });
    return this.projectRepository.save(project);
  }

  findAll() {
    return this.projectRepository.find({ relations: { teams: true } });
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { teams: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  async assignTeams(id: number, teamIds: number[]) {
    const project = await this.findOne(id);
    project.teams = await this.findTeams(teamIds);
    return this.projectRepository.save(project);
  }

  private async findTeams(teamIds: number[]) {
    if (teamIds.length === 0) return [];

    const teams = await this.teamRepository.find({ where: { id: In(teamIds) } });
    if (teams.length !== teamIds.length) {
      const foundIds = new Set(teams.map((team) => team.id));
      const missingIds = teamIds.filter((id) => !foundIds.has(id));
      throw new UnprocessableEntityException(
        `Team ids not found: ${missingIds.join(', ')}`,
      );
    }
    return teams;
  }
}
