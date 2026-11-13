import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';


// Only what the team lead is allowed to provide. status and requestedBy are
// NOT here: the server sets them.
export class CreateResourceRequestDto {
  @ApiProperty({
    description: 'Short description of the item being requested',
    example: 'Laptop for design team',
  })
  @ApiProperty({ example: 'Laptop for field data collection' })
  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @ApiProperty({
    description: 'Batch number printed on the item or its packaging',
    example: 'B-2024-001',
  })
  @ApiProperty({ example: 'LOT-2026-04' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({
    description: 'How many units are requested (at least 1)',
    example: 3,
  })
  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Expected number of days the requested resource will be assigned to the requester',
    example: 14,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  expectedDurationDays: number;

  @ApiProperty({ example: 'Office Modernization' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiProperty({ example: 'Jordan Lee', description: 'Full name of the active Line Manager who will review the request.' })
  @IsString()
  @IsNotEmpty()
  lineManagerName: string;

  @ApiProperty({ example: 'Platform' })
  @IsString()
  @IsNotEmpty()
  teamName: string;
}
