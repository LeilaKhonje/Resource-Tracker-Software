import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Only what the team lead is allowed to provide. status and requestedBy are
// NOT here: the server sets them.
export class CreateResourceRequestDto {
  @ApiProperty({
    description: 'Short description of the item being requested',
    example: 'Laptop for design team',
  })
  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @ApiProperty({
    description: "The manufacturer's label or model name of the item",
    example: 'Dell XPS 15',
  })
  @IsString()
  @IsNotEmpty()
  manufacturerLabel: string;

  @ApiProperty({
    description: 'Price of one unit, with at most two decimal places',
    example: 1500.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Batch number printed on the item or its packaging',
    example: 'B-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({
    description: 'Name of the vendor supplying the item',
    example: 'Dell',
  })
  @IsString()
  @IsNotEmpty()
  vendor: string;

  @ApiProperty({
    description: 'How many units are requested (at least 1)',
    example: 3,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Id of the project the resource is for',
    example: 'proj-1',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Id of the line manager who will review the request',
    example: 'manager-1',
  })
  @IsString()
  @IsNotEmpty()
  lineManagerId: string;

  // SRS: a request must come from a team, and that team must have a department.
  @ApiProperty({
    description: 'Id of the team making the request',
    example: 'team-1',
  })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({
    description: 'Id of the department the team belongs to',
    example: 'dept-1',
  })
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}