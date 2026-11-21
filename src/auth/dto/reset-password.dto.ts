import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'alex@gmail.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6, description: 'Six-digit code sent to the email address.' })
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;

  @ApiProperty({ example: 'newSecure456', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
