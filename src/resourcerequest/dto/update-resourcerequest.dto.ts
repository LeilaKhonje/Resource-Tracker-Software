import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateResourceRequestDto } from './create-resourcerequest.dto';
import { RequestStatus } from '../entities/resourcerequest.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResourceRequestDto extends PartialType(CreateResourceRequestDto) {
  @ApiPropertyOptional({ enum: RequestStatus, example: RequestStatus.SUBMITTED })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ example: 'Please provide a vendor quote. Required when status is REJECTED or QUERIED.' })
  @IsOptional()
  @IsString()
  note?: string;
}
