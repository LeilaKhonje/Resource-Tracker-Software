import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
