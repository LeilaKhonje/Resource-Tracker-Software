import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../entities/resourcerequest.entity';


export class UpdateStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;

  
  @IsOptional()
  @IsString()
  note?: string;
}