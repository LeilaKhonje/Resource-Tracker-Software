import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { Resources } from './entities/resources.entity';
import { ResourceType } from './enum/resource-type.enum';

const INSOURCED_FIELDS = ['description', 'department'] as const;
const OUTSOURCED_FIELDS = ['price', 'label', 'batchNumber', 'vendor'] as const;

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resources)
    private readonly resourcesRepository: Repository<Resources>,
  ) {}

  async create(dto: CreateResourceDto): Promise<Resources>{
    const resource = dto.type === ResourceType.INSOURCED ? this.resourcesRepository.create({
        name: dto.name,
        type: dto.type,
        description: dto.description,
        department: dto.department,
    })
    : this.resourcesRepository.create({
        name: dto.name,
        type: dto.type,
        price: dto.price,
        label: dto.label,
        batchNumber: dto.batchNumber,
        vendor: dto.vendor,
    });
    return this.resourcesRepository.save(resource);
}
async findAll(query: QueryResourceDto): Promise<Resources[]>{
    const where: FindOptionsWhere<Resources> = {};
    if (query.name) where.name = ILike(`%${query.name}%`);
    if (query.type) where.type = query.type;

    return this.resourcesRepository.find({ where, order: { createdAt: 'DESC'} });

}
async findOne(id: string): Promise<Resources>
{
    const resource = await this.resourcesRepository.findOne({ where: { id }});
    if(!resource){
        throw new NotFoundException('Resource with id "${id}" not found');
    }
    return resource;
}
async update(id: string, dto: UpdateResourceDto): Promise<Resources>{
    const resource = await this.findOne(id);

    const forbidden = resource.type === ResourceType.INSOURCED ? OUTSOURCED_FIELDS : INSOURCED_FIELDS;
    const invalid = forbidden.filter(
        (field) => (dto as Record<string, unknown>)[field] !== undefined,);
        if(invalid.length){
            throw new BadRequestException(
                `'field(s)' [${invalid.join(',')}]) are not valid for ${resource.type} resources`,
            );
        }
        Object.assign(resource, dto);
        return this.resourcesRepository.save(resource);

}
}
