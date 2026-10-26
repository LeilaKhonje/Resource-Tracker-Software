import { ArrayMaxSize, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class AssignProjectTeamsDto {
  @IsArray()
  @ArrayMaxSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  teamIds: number[];
}
