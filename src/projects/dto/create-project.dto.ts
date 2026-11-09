import {ArrayUnique, IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength, Min} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ type: String, example: 'Office Modernization', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  name: string;

  @ApiProperty({ type: String, example: '2026-01-01', description: 'Project start date (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiProperty({ type: String, example: '2026-12-31', description: 'Project end date (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Upgrade shared office equipment', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: [Number], example: [1], description: 'Optional team IDs to associate with the project' })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  teamIds?: number[];
}
