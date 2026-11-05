import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateResourceRequestDto } from './create-resourcerequest.dto';
import { RequestStatus } from '../entities/resourcerequest.entity';

// One body for every change to a request. Send only the fields you need.
// The fields of the create DTO come from PartialType and are all optional.
export class UpdateResourceRequestDto extends PartialType(CreateResourceRequestDto) {
  @ApiPropertyOptional({
    enum: RequestStatus,
    description:
      'SUBMITTED (team lead sends the request for review), or APPROVED, ' +
      'REJECTED, QUERIED (line manager decides)',
    example: 'SUBMITTED',
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Required when the line manager rejects or queries a request',
    example: 'Need a cheaper quote',
  })
  @IsOptional()
  @IsString()
  note?: string;
}