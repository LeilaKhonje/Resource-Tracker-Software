import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateResourceDto {
  @ApiPropertyOptional({ example: 'Office laptop' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'Laptop allocated from existing inventory' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ example: 'Computing' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  departmentName?: string;

  @ApiPropertyOptional({ example: 1250.5, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'Dell Latitude' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @ApiPropertyOptional({ example: 'BATCH-2026-01' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  batchNumber?: string;

  @ApiPropertyOptional({ example: 'Example Supplies Ltd' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  vendor?: string;
}
