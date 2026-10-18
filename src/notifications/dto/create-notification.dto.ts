
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
