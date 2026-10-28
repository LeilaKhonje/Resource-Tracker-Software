import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../entities/resourcerequest.entity';

export class QueryResourceRequestDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}