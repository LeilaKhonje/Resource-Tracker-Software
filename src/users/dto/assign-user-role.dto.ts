import { IsEnum, IsNotIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user-role.enum';

export class AssignUserRoleDto {
  @ApiProperty({ enum: Object.values(UserRole).filter((role) => role !== UserRole.SYSTEM_ADMIN), example: UserRole.TEAM_LEAD })
  @IsEnum(UserRole)
  @IsNotIn([UserRole.SYSTEM_ADMIN], { message: 'The System Admin role can only be assigned through the bootstrap process' })
  role: UserRole;
}
