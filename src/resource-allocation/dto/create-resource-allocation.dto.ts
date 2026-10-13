import{ IsInt, IsPositive, } from 'class-validator';

export class
CreateResourceAllocationDto{ 
    @IsInt()
    @IsPositive()
    requestId: number;

    @IsInt()
    @IsPositive()
    resourceId: number;

    @IsInt()
    @IsPositive()
    quantityAllocated: number;

}