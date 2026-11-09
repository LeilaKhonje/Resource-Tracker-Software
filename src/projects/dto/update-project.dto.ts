import { IsDateString, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Office Modernization', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Upgrade shared office equipment', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: '2026-01-01', description: 'Project start date (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: '2026-12-31', description: 'Project end date (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}
