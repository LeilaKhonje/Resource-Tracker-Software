import { PartialType } from '@nestjs/swagger';
import { CreateOutsourcedResourceDto } from './create-outsourced-resource.dto';

export class UpdateOutsourcedResourceDto extends PartialType(CreateOutsourcedResourceDto) {}