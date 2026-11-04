import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user-role.enum';

export class AssignUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.TEAM_LEAD })
  @IsEnum(UserRole)
  role: UserRole;
}
