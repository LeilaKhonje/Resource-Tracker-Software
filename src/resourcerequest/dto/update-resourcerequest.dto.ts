import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateResourceRequestDto } from './create-resourcerequest.dto';
import { RequestStatus } from '../entities/resourcerequest.entity';

export class UpdateResourceRequestDto extends PartialType(CreateResourceRequestDto) {
  
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  
  @IsOptional()
  @IsString()
  note?: string;
}