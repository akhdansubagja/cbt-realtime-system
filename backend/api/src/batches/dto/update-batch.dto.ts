// backend/api/src/batches/dto/update-batch.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBatchDto } from './create-batch.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @IsString()
  @IsOptional()
  name?: string;
}