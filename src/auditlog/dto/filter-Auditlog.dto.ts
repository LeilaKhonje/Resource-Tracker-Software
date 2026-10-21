
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class FilterAuditLogsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
