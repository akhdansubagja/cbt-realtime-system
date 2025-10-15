// src/questions/dto/create-question.dto.ts
import { QuestionType } from "../entities/question.entity";
export class CreateQuestionDto {
  bank_id: number; // ID dari bank soal
  question_text: string;
  question_type: QuestionType; // 'multiple_choice' atau 'essay'
  options?: any; // Opsional
  correct_answer?: string; // Opsional
}