import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../entities/resourcerequest.entity';

export class QueryResourceRequestDto {
  @ApiPropertyOptional({ description: 'Only show requests from this team' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({
    enum: RequestStatus,
    description: 'Only show requests with this status',
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}