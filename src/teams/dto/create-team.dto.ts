import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateTeamDto {
  @IsString()
  @ApiProperty({ type: String, example: 'Procurement', minLength: 3, maxLength: 100 })
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, example: 'Sources equipment and supplies', maxLength: 500 })
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsInt()
  @ApiProperty({ type: Number, example: 2, minimum: 1 })
  @Min(1)
  departmentId: number;
}
