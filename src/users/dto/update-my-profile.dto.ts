import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: '+265991234567', maxLength: 30 })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?[0-9 ()-]{10}$/, { message: 'Phone number must contain 7 to 30 digits and may include +, spaces, parentheses, or hyphens' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Lilongwe, Malawi', maxLength: 255 })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: '1990-05-20', format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date of birth must use YYYY-MM-DD format' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: ['Mr.', 'Mrs.'], example: 'Mrs.' })
  @IsOptional()
  @IsIn(['Mr.', 'Mrs.', 'Miss'])
  preferredPronoun?: 'Mr.' | 'Mrs.' | 'Miss';
}
