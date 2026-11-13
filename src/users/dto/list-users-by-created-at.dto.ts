import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListUsersByCreatedAtDto {
  @ApiProperty({
    description: 'Inclusive start timestamp for account creation (ISO 8601).',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsDateString({ strict: true })
  startDate: string;

  @ApiProperty({
    description: 'Inclusive end timestamp for account creation (ISO 8601).',
    example: '2026-11-11T23:59:59.999Z',
  })
  @IsDateString({ strict: true })
  endDate: string;
}
