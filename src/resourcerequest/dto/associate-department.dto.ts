import { IsString, IsNotEmpty } from 'class-validator';

export class AssociateTeamDto {
  @IsString()
  @IsNotEmpty()
  teamId: string;
}