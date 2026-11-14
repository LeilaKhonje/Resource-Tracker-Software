import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOutsourcedResourceDto {
  @ApiProperty({ example: 'Dell Latitude 5450' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1250.5, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Dell Latitude' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'BATCH-2026-01' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({ example: 'Example Supplies Ltd' })
  @IsString()
  @IsNotEmpty()
  vendor: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}