import { IsOptional, IsString } from 'class-validator';

export class CreateBulkWithAvatarsDto {
  @IsString()
  data: string; // JSON string of { name: string, fileIndex?: number }[]

  @IsOptional()
  batch_id?: number | string; // Can come as string from FormData
}
