import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTeamLeadDto {
  @ApiProperty({ format: 'uuid', description: 'ID of a user with the team lead role' })
  @IsUUID()
  userId: string;
}
