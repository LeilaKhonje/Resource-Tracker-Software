
import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class DashboardFilterDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
