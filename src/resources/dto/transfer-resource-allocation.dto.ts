import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class TransferResourceAllocationDto {
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

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  note?: string;
}
