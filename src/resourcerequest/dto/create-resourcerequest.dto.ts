import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';


// Only what the team lead is allowed to provide. status and requestedBy are
// NOT here: the server sets them.
export class CreateResourceRequestDto {
  @ApiProperty({
    description: 'ID of the existing catalog resource being requested.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  resourceId: string;

  @ApiPropertyOptional({
    description: 'Optional specifications or context for the selected catalog resource.',
    example: 'For field data collection; needs 16 GB RAM.',
  })
  @IsOptional()
  @IsString()
  itemDescription?: string;

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

  @ApiProperty({ example: '3', description: 'Selected project ID from GET /api/v1/teams/{teamId}/projects.' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'Jordan Lee', description: 'Full name of the active Line Manager who will review the request.' })
  @IsString()
  @IsNotEmpty()
  lineManagerName: string;

  @ApiProperty({ example: '2', description: 'Team ID from the authenticated Team Lead profile.' })
  @IsString()
  @IsNotEmpty()
  teamId: string;
}
