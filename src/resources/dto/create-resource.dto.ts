import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ResourceType } from '../enum/resource-type.enum';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ResourceType)
  type: ResourceType;

  // ---- Required when type === available ----
  @ValidateIf((o) => o.type === ResourceType.INSOURCED)
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ValidateIf((o) => o.type === ResourceType.INSOURCED)
  @IsString()
  @IsNotEmpty()
  department?: string;

  // ---- Required when type === outsourced ----
  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsString()
  @IsNotEmpty()
  label?: string;

  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsString()
  @IsNotEmpty()
  batchNumber?: string;

  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsString()
  @IsNotEmpty()
  vendor?: string;
}