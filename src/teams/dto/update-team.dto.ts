import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  departmentId?: number;
}
