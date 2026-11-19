import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ResourceType } from '../enum/resource-type.enum';

@ValidatorConstraint({ name: 'resourceFieldsMatchType', async: false })
class ResourceFieldsMatchTypeConstraint implements ValidatorConstraintInterface {
  validate(type: ResourceType, args?: ValidationArguments): boolean {
    if (!args) return false;
    const resource = args.object as Record<string, unknown>;
    const fieldsToReject =
      type === ResourceType.INSOURCED
        ? ['price', 'label', 'batchNumber', 'vendor']
        : ['description', 'departmentName'];

    return fieldsToReject.every((field) => resource[field] === undefined);
  }

  defaultMessage(): string {
    return 'Fields for the other resource type are not allowed.';
  }
}

export class CreateResourceDto {
  @ApiProperty({ enum: ResourceType, example: ResourceType.INSOURCED })
  @IsEnum(ResourceType)
  @Validate(ResourceFieldsMatchTypeConstraint)
  type: ResourceType;

  @ApiProperty({ example: 'Office laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Laptop allocated from existing inventory' })
  @ValidateIf(
    (resource: CreateResourceDto) => resource.type === ResourceType.INSOURCED,
  )
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ example: 'Computing' })
  @ValidateIf(
    (resource: CreateResourceDto) => resource.type === ResourceType.INSOURCED,
  )
  @IsString()
  @IsNotEmpty()
  departmentName?: string;

  @ApiPropertyOptional({ example: 1250.5, minimum: 0 })
  @ValidateIf(
    (resource: CreateResourceDto) => resource.type === ResourceType.OUTSOURCED,
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'Dell Latitude' })
  @ValidateIf(
    (resource: CreateResourceDto) => resource.type === ResourceType.OUTSOURCED,
  )
  @IsString()
  @IsNotEmpty()
  label?: string;

  @ApiPropertyOptional({ example: 'BATCH-2026-01' })
  @ValidateIf(
    (resource: CreateResourceDto) => resource.type === ResourceType.OUTSOURCED,
  )
  @IsString()
  @IsNotEmpty()
  batchNumber?: string;

  @ApiPropertyOptional({ example: 'Example Supplies Ltd' })
  @ValidateIf(
    (resource: CreateResourceDto) => resource.type === ResourceType.OUTSOURCED,
  )
  @IsString()
  @IsNotEmpty()
  vendor?: string;
}

export type InsourcedResourceInput = CreateResourceDto & {
  type: ResourceType.INSOURCED;
  description: string;
  departmentName: string;
};

export type OutsourcedResourceInput = CreateResourceDto & {
  type: ResourceType.OUTSOURCED;
  price: number;
  label: string;
  batchNumber: string;
  vendor: string;
};

export function isInsourcedResourceInput(
  dto: CreateResourceDto,
): dto is InsourcedResourceInput {
  return dto.type === ResourceType.INSOURCED;
}

export function isOutsourcedResourceInput(
  dto: CreateResourceDto,
): dto is OutsourcedResourceInput {
  return dto.type === ResourceType.OUTSOURCED;
}
