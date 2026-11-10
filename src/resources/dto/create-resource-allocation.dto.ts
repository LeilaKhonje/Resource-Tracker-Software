import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateResourceAllocationDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 8, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId: number;

  @ApiProperty({ example: 12, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projectId: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assignedToUserId: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  expectedReturnAt?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Approved request being fulfilled.' })
  @IsOptional()
  @IsUUID()
  requestId?: string;
}
