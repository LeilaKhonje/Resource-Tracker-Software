import {ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Min} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ type: String, example: 'Office Modernization', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Upgrade shared office equipment', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ApiProperty({ type: [Number], example: [1], description: 'At least one team ID in the department is required by the create operation' })
  @IsArray()
  @ArrayMaxSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  teamIds?: number[];
}
