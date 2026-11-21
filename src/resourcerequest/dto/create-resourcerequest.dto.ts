import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';


// Only what the team lead is allowed to provide. status and requestedBy are
// NOT here: the server sets them.
export class CreateResourceRequestDto {
  @ApiProperty({ format: 'uuid', description: 'ID of the resource catalog item being requested' })
  @IsUUID()
  resourceId: string;

  @ApiProperty({
    description: 'ID of the existing catalog resource being requested.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  itemDescription: string;

  @ApiProperty({ description: 'Batch number printed on the item or its packaging', example: 'LOT-2026-04' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

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

  @ApiProperty({ example: 12, description: 'Numeric ID of the project assigned to the team' })
  @IsInt()
  @Min(1)
  projectId: number;

  @ApiProperty({ example: 'Jordan Lee', description: 'Full name of the active Line Manager who will review the request.' })
  @IsString()
  @IsNotEmpty()
  lineManagerName: string;


  @ApiProperty({ example: 4, description: 'Numeric ID of the team submitting the request' })
  @IsInt()
  @Min(1)
  teamId: number;
}
