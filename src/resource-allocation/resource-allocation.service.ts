import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateResourceAllocationDto } from './dto/create-resource-allocation.dto';

@Injectable()
export class ResourceAllocationService {
    private allocation: any[]=[];
    private nextId = 1;

    findAll(){
        return this.allocation;
    }

    findOne(id: number){
        const allocation = this.allocation.find(
        (item) => item.id === id,);

        if(!allocation){
            throw new NotFoundException(`Resource allocation $ {id} was not found`,);
        }
        return allocation;
    }
    create(dto: CreateResourceAllocationDto){ if (dto.quantityAllocated <= 0){
        throw new BadRequestException(
            `Allocated quantity must be greater than zero`,
        );
    }
    const allocation = {id: this.nextId++, requestId: dto.requestId, resourceId: dto.resourceId,
        quantityAllocated: dto.quantityAllocated, allocationAt: new Date()
    };
    this.allocation.push(allocation);
    return allocation;
    }
}
