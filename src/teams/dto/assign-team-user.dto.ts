import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTeamUserDto {
  @ApiProperty({ format: 'uuid', description: 'ID of an active Team Lead or Team Member' })
  @IsUUID()
  userId: string;
}
