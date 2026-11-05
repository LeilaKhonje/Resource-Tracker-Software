import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateResourceRequestDto {
  @ApiProperty({ example: 'Laptop for field data collection' })
  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @ApiProperty({ example: 'ThinkPad T14' })
  @IsString()
  @IsNotEmpty()
  manufacturerLabel: string;

  @ApiProperty({ example: 1200, minimum: 0.01, description: 'Unit price, with at most two decimal places.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({ example: 'LOT-2026-04' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({ example: 'Example Supplies' })
  @IsString()
  @IsNotEmpty()
  vendor: string;

  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '12', description: 'Project numeric ID encoded as a string.' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ format: 'uuid', example: 'b9ca58fa-1a9a-4e5e-ad3e-badb621d783f', description: 'User ID of the line manager assigned to review this request.' })
  @IsString()
  @IsNotEmpty()
  lineManagerId: string;

  @ApiProperty({ example: '8', description: 'Team numeric ID encoded as a string.' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({ example: '2', description: 'Department numeric ID encoded as a string.' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
