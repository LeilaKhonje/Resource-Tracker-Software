import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceRequestDto } from './create-resourcerequest.dto';

export class UpdateResourceRequestDto extends PartialType(CreateResourceRequestDto) {}