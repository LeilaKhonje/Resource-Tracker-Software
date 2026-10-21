import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';


export class CreateResourceRequestDto {
  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @IsString()
  @IsNotEmpty()
  manufacturerLabel: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @IsString()
  @IsNotEmpty()
  vendor: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  lineManagerId: string;
}