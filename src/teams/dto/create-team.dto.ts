import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsInt()
  @Min(1)
  departmentId: number;
}
