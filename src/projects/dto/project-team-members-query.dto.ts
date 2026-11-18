import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ProjectTeamMembersQueryDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'Filter members to one team assigned to the project',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId?: number;
}
