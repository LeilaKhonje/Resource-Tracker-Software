
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectResourceRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
