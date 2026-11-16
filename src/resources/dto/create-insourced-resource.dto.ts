import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateInsourcedResourceDto {
  @ApiProperty({ example: 'Office laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Laptop allocated from existing inventory' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Computing' })
  @IsString()
  @IsNotEmpty()
  departmentName: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}