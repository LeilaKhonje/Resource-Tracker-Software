import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateResourceDto } from './create-resource.dto';

// All fields optional; `type` cannot be changed after creation.
export class UpdateResourceDto extends PartialType(
  OmitType(CreateResourceDto, ['type'] as const),
) {}