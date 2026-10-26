import { IsString, IsNotEmpty } from 'class-validator';

export class AssociateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
