import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BulkOptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

class BulkQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsEnum(['multiple_choice', 'essay'])
  type: 'multiple_choice' | 'essay';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkOptionDto)
  options: BulkOptionDto[];
}

export class CreateBulkQuestionsDto {
  @IsNumber()
  @IsNotEmpty()
  bankId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkQuestionDto)
  questions: BulkQuestionDto[];
}
