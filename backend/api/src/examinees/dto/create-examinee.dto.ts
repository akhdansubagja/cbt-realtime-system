import { IsNotEmpty, IsOptional, IsString, IsInt, } from 'class-validator';

export class CreateExamineeDto {
  @IsInt()
  @IsOptional()
  batch_id?: number;
}
