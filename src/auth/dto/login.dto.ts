import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ type: String, example: 'alex@gmail.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @ApiProperty({ type: String, example: 'secure123', minLength: 8, maxLength: 12, description: 'Must contain at least one digit' })
  @MinLength(8)
  @MaxLength(12)
  @Matches(/\d/, { message: 'Password must contain at least one digit' })
  password: string;
}
