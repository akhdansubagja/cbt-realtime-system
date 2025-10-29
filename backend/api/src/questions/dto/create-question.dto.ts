// src/questions/dto/create-question.dto.ts
import { QuestionType } from "../entities/question.entity";
import { IsIn } from 'class-validator';
export class CreateQuestionDto {
  bank_id: number; // ID dari bank soal
  question_text: string;
  @IsIn([QuestionType.MULTIPLE_CHOICE])
  question_type: QuestionType; // 'multiple_choice' atau 'essay'
  options?: any; // Opsional
  correct_answer?: string; // Opsional
  image_url?: string;
}