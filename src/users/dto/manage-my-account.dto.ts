import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum MyAccountAction {
  UPDATE_PROFILE = 'update_profile',
  CHANGE_PASSWORD = 'change_password',
}

export class ManageMyAccountDto {
  @ApiProperty({ enum: MyAccountAction, example: MyAccountAction.UPDATE_PROFILE })
  @IsEnum(MyAccountAction)
  action: MyAccountAction;

  @ApiPropertyOptional({ example: '+265991234567', maxLength: 30 })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(30)
  @IsNumberString({}, { message: 'Phone number must contain only digits' })
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

  @ApiPropertyOptional({ enum: ['Mr.', 'Mrs.', 'Miss'], example: 'Mrs.' })
  @IsOptional()
  @IsIn(['Mr.', 'Mrs.', 'Miss'])
  preferredPronoun?: 'Mr.' | 'Mrs.' | 'Miss';

  @ApiPropertyOptional({ example: 'current123' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  currentPassword?: string;

  @ApiPropertyOptional({
    example: 'newSecure456',
    minLength: 8,
    maxLength: 12,
    description: 'Required with currentPassword when action is change_password; must contain at least one number',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  newPassword?: string;
}
