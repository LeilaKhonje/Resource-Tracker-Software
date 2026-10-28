import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'current123' })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  currentPassword: string;

  @ApiProperty({
    example: 'newSecure456',
    minLength: 8,
    maxLength: 12,
    description: 'Must contain at least one number',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  newPassword: string;
}
