import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsNotIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ApiProperty({ example: 'Alex' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\p{N}]+$/u, { message: 'Name fields must not contain numbers' })
  @MaxLength(60)
  firstName: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ApiPropertyOptional({ example: 'James' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\p{N}]+$/u, { message: 'Name fields must not contain numbers' })
  @MaxLength(60)
  middleName?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ApiProperty({ example: 'Morgan' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\p{N}]+$/u, { message: 'Name fields must not contain numbers' })
  @MaxLength(60)
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
