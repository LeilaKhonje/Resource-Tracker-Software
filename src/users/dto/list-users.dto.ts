import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ListUsersDto {
  @ApiPropertyOptional({
    description: 'Inclusive start timestamp for account creation (ISO 8601). Supply together with endDate.',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Inclusive end timestamp for account creation (ISO 8601). Supply together with startDate.',
    example: '2026-11-11T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  endDate?: string;
}
