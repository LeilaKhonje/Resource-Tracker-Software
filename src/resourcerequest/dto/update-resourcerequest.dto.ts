import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CreateResourceRequestDto } from './create-resourcerequest.dto';
import { RequestStatus } from '../entities/resourcerequest.entity';


// One body for every change to a request. Send only the fields you need.
// The fields of the create DTO come from PartialType and are all optional.
export class UpdateResourceRequestDto extends PartialType(CreateResourceRequestDto) {
  @ApiPropertyOptional({
    example: 3,
    minimum: 1,
    description: 'Quantity approved by the Line Manager. Only valid with status APPROVED; defaults to the full requested quantity.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  approvedQuantity?: number;

  @ApiPropertyOptional({ enum: RequestStatus, example: RequestStatus.SUBMITTED })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ example: 'Please provide a vendor quote. Required when status is REJECTED or QUERIED.' })
  @IsOptional()
  @IsString()
  note?: string;
}
