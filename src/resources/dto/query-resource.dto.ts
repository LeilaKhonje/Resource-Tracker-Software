import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '../enum/resource-type.enum';

export class QueryResourceDto {
  @ApiPropertyOptional({ description: 'Case-insensitive substring filter for resource name.', example: 'laptop' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by resource type.', enum: ResourceType, example: ResourceType.OUTSOURCED })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;
}
