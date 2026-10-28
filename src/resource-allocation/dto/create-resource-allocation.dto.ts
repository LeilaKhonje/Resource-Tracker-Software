import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateResourceAllocationDto {
  @ApiProperty({ type: Number, example: 12, minimum: 1 })
  @IsInt()
  @IsPositive()
  requestId: number;

  @ApiProperty({ type: Number, example: 4, minimum: 1 })
  @IsInt()
  @IsPositive()
  resourceId: number;

  @ApiProperty({ type: Number, example: 5, minimum: 1 })
  @IsInt()
  @IsPositive()
  quantityAllocated: number;
}
