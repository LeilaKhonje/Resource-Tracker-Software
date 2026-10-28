import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ type: String, example: 'Finance', minLength: 3, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'FIN', minLength: 2, maxLength: 20 })
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code must contain only uppercase letters, numbers, underscore, or hyphen',
  })
  code?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Finance and accounting', maxLength: 500 })
  @IsString()
  @Length(0, 500)
  description?: string;
}
