class ExamQuestionDto {
  question_id: number;
  point: number;
}

export class CreateExamDto {
  title: string;
  code: string;
  duration_minutes: number;
  questions: ExamQuestionDto[];
  
  // --- TAMBAHKAN DUA BARIS INI ---
  start_time?: Date; // Tanda tanya (?) berarti properti ini opsional
  end_time?: Date;
}