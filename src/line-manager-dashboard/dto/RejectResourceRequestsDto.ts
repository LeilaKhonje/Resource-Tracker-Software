
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectResourceRequestDto {
  @ApiProperty({ type: String, example: 'The requested item is outside the approved budget.', minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
