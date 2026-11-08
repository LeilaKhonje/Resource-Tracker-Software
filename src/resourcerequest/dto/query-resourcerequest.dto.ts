import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../entities/resourcerequest.entity';


export class QueryResourceRequestDto {
  @ApiPropertyOptional({ example: '8', description: 'Filter to a numeric team ID.' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ enum: RequestStatus, example: RequestStatus.SUBMITTED })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}
