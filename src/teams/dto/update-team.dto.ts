import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTeamDto {
  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Procurement', minLength: 3, maxLength: 50 })
  @IsString()
  @Length(3, 50)
  name?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Sources equipment and supplies', maxLength: 50 })
  @IsString()
  @Length(0, 50)
  description?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Number, example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  departmentId?: number;
}
