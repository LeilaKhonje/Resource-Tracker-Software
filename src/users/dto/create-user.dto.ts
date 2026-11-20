import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsNotIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ApiProperty({ example: 'Alex', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ApiProperty({ example: 'Jordan', required: false, maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  middleName?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ApiProperty({ example: 'Morgan', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  surname: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @ApiProperty({ example: 'alex@gmail.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    enum: Object.values(UserRole).filter((role) => role !== UserRole.SYSTEM_ADMIN),
    example: UserRole.TEAM_MEMBER,
    description: 'Business role to assign to the new account',
  })
  @IsEnum(UserRole)
  @IsNotIn([UserRole.SYSTEM_ADMIN], { message: 'The System Admin role is assigned only through the bootstrap process' })
  role: UserRole;
}
