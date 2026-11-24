import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateResourceUnitDto {
  @ApiPropertyOptional({ maxLength: 100, example: 'SN-ABC-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'ASSET-00042' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assetTag?: string;
}
