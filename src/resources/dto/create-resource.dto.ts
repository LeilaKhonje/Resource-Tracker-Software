import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ResourceType } from '../enum/resource-type.enum';

export class CreateResourceDto {
  @ApiProperty({ description: 'Resource name.', example: 'Office laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Resource classification. Determines which other fields are required.', enum: ResourceType, example: ResourceType.OUTSOURCED })
  @IsEnum(ResourceType)
  type: ResourceType;

  // ---- Required when type === insourced ----
  @ApiProperty({ required: false, description: 'Required when type is "insourced".', example: 'Laptop allocated from existing inventory' })
  @ValidateIf((o) => o.type === ResourceType.INSOURCED)
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ required: false, description: 'Required when type is "insourced".', example: 'Information Technology' })
  @ValidateIf((o) => o.type === ResourceType.INSOURCED)
  @IsInt()
  @Min(1)
  departmentId?: number;

  // ---- Required when type === outsourced ----
  @ApiProperty({ required: false, description: 'Required when type is "outsourced"; non-negative and at most two decimal places.', example: 1250.5, minimum: 0 })
  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiProperty({ required: false, description: 'Required when type is "outsourced".', example: 'Dell Latitude 5450' })
  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsString()
  @IsNotEmpty()
  batchNumber?: string;

  @ApiProperty({ required: false, description: 'Required when type is "outsourced".', example: 'Example Supplies Ltd' })
  @ValidateIf((o) => o.type === ResourceType.OUTSOURCED)
  @IsString()
  @IsNotEmpty()
  vendor?: string;
}
