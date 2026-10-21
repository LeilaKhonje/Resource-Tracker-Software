
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional,Min } from 'class-validator';
//import { RequestStatus } from '../../resource-requests/resource-request.entity';

export class QueryResourceRequestsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  resourceId?: number;

  //@IsOptional()
  //@IsEnum(RequestStatus)
 //status?: RequestStatus;
}
