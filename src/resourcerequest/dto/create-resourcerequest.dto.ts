import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
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
    description: "The manufacturer's label or model name of the item",
    example: 'Dell XPS 15',
  })
  @ApiProperty({ example: 'ThinkPad T14' })
  @IsString()
  @IsNotEmpty()
  manufacturerLabel: string;

  @ApiProperty({
    description: 'Price of one unit, with at most two decimal places',
    example: 1500.5,
  })
  @ApiProperty({ example: 1200, minimum: 0.01, description: 'Unit price, with at most two decimal places.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Batch number printed on the item or its packaging',
    example: 'B-2024-001',
  })
  @ApiProperty({ example: 'LOT-2026-04' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({
    description: 'Name of the vendor supplying the item',
    example: 'Dell',
  })
  @ApiProperty({ example: 'Example Supplies' })
  @IsString()
  @IsNotEmpty()
  vendor: string;

  @ApiProperty({
    description: 'How many units are requested (at least 1)',
    example: 3,
  })
  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Id of the project the resource is for',
    example: 'proj-1',
  })
  @ApiProperty({ example: '12', description: 'Project numeric ID encoded as a string.' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Id of the line manager who will review the request',
    example: 'manager-1',
  })
  @ApiProperty({ format: 'uuid', example: 'b9ca58fa-1a9a-4e5e-ad3e-badb621d783f', description: 'User ID of the line manager assigned to review this request.' })
  @IsString()
  @IsNotEmpty()
  lineManagerId: string;

  // SRS: a request must come from a team, and that team must have a department.
  @ApiProperty({
    description: 'Id of the team making the request',
    example: 'team-1',
  })
  @ApiProperty({ example: '8', description: 'Team numeric ID encoded as a string.' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({
    description: 'Id of the department the team belongs to',
    example: 'dept-1',
  })
  @ApiProperty({ example: '2', description: 'Department numeric ID encoded as a string.' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
