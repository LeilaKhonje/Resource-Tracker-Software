import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ type: String, example: 'alex@company.com', description: 'Company email address' })
  @IsEmail()
  @MaxLength(254)
  @Matches(/@gmail.com$/, { message: 'Email must be a company email' })
  email: string;

  @IsString()
  @ApiProperty({ type: String, example: 'Alex' })
  firstName: string;

  @IsString()
  @ApiProperty({ type: String, example: 'Morgan' })
  lastName: string;

  @IsString()
  @ApiProperty({ type: String, example: 'secure123', minLength: 8, maxLength: 12, description: 'Must include a number' })
  @MinLength(8)
  @MaxLength(12)
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  password: string;
}
