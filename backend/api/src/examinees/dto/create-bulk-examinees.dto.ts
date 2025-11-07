// backend/api/src/examinees/dto/create-bulk-examinees.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBulkExamineesDto {
  // Kita akan menerima 'names' sebagai array string
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  names: string[];

  // batch_id akan dikirim sebagai string dari FormData,
  // jadi kita perlu @Type(() => Number) untuk mengubahnya
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  batch_id?: number;
}