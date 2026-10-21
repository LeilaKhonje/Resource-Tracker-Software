import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class AssignUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsInt()
  @Min(1)
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamId?: number;
}
