import { PartialType } from '@nestjs/mapped-types';
import { CreateExamineeDto } from './create-examinee.dto';
import { IsOptional, IsUUID, IsInt, IsString } from 'class-validator';

export class UpdateExamineeDto extends PartialType(CreateExamineeDto) {
  @IsInt()
  @IsOptional()
  batch_id?: number;

  @IsString()
  @IsOptional()
  workplace?: string;
}
