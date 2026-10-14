import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code must contain only uppercase letters, numbers, underscore, or hyphen',
  })
  code?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}