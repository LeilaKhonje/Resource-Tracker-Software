import { IsEmail, IsString, Matches,MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ type: String, example: 'alex@company.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @ApiProperty({ type: String, example: 'secure123', maxLength: 12, description: 'Must contain at least one number' })
  @MaxLength(12)
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  password: string;
}
