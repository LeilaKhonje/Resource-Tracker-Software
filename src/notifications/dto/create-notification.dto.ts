
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
    @ApiProperty({ type: Number, example: 15 })
  @IsInt()
  userId: number;

  @ApiProperty({ type: String, example: 'Your request was approved.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
