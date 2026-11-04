import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user-role.enum';

export class AssignUserRoleDto {
  @ApiProperty({
    enum: [UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD],
    example: UserRole.DEPARTMENT_HEAD,
  })
  @IsIn([UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD])
  role: UserRole.DEPARTMENT_HEAD | UserRole.TEAM_LEAD;
}