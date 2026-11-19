import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotIn, IsOptional } from 'class-validator';
import { UserRole } from '../user-role.enum';

export enum UserManagementAction {
  DEACTIVATE = 'deactivate',
  REACTIVATE = 'reactivate',
  ASSIGN_ROLE = 'assign_role',
}

export class ManageUserDto {
  @ApiProperty({ enum: UserManagementAction, example: UserManagementAction.DEACTIVATE })
  @IsEnum(UserManagementAction)
  action: UserManagementAction;

  @ApiPropertyOptional({
    enum: Object.values(UserRole).filter((role) => role !== UserRole.SYSTEM_ADMIN),
    example: UserRole.TEAM_LEAD,
    description: 'Required only when action is assign_role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  @IsNotIn([UserRole.SYSTEM_ADMIN], {
    message: 'The System Admin role can only be assigned through the bootstrap process',
  })
  role?: UserRole;
}
