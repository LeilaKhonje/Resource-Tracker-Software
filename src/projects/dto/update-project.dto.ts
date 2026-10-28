import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
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
}
