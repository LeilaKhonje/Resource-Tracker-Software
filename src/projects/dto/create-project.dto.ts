import {ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Min} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  teamIds?: number[];
}
