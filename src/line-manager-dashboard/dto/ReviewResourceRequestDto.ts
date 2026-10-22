
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewResourceRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  comment: string;
}
