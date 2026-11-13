import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsNotIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ApiProperty({ example: 'Alex Morgan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @ApiProperty({ example: 'alex@company.com', description: 'Company email address' })
  @IsEmail()
  @MaxLength(254)
  @Matches(/@company\.com$/, { message: 'Email must be company email' })
  email: string;

  @ApiProperty({
    enum: Object.values(UserRole).filter((role) => role !== UserRole.SYSTEM_ADMIN),
    example: UserRole.TEAM_MEMBER,
    description: 'Business role to assign to the new account',
  })
  @IsEnum(UserRole)
  @IsNotIn([UserRole.SYSTEM_ADMIN], { message: 'The System Admin role is assigned only through the bootstrap process' })
  role: UserRole;

  @ApiProperty({ example: 'Temp1234', minLength: 8, maxLength: 12, description: 'Initial password supplied to the designated user; must include a number' })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  @Matches(/\d/, { message: 'Initial password must contain at least one number' })
  initialPassword: string;
}
