import { PartialType } from '@nestjs/swagger';
import { CreateInsourcedResourceDto } from './create-insourced-resource.dto';

export class UpdateInsourcedResourceDto extends PartialType(CreateInsourcedResourceDto) {}