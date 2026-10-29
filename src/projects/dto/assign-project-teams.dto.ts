import { ArrayMaxSize, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignProjectTeamsDto {
  @ApiProperty({ type: [Number], example: [1], description: 'Replacement list of team IDs' })
  @IsArray()
  @ArrayMaxSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  teamIds: number[];
}
