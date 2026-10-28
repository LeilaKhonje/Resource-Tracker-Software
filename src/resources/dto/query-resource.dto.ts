import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ResourceType } from '../enum/resource-type.enum';

export class QueryResourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;
}