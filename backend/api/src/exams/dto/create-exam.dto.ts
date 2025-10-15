// src/exams/dto/create-exam.dto.ts

class ExamQuestionDto {
  question_id: number;
  point: number;
}

export class CreateExamDto {
  title: string;
  code: string;
  duration_minutes: number;
  questions: ExamQuestionDto[]; // Array berisi soal dan poinnya
}