import { IsEmail, IsString, Matches,MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(12)
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  password: string;
}
