import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'A valid refresh token returned by login' })
  @IsString()
  @IsJWT()
  refreshToken: string;
}
