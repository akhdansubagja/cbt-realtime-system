// DTO untuk soal yang dipilih manual
class ManualQuestionDto {
  question_id: number;
  point: number;
}

// DTO untuk aturan soal acak
class RandomRuleDto {
  question_bank_id: number;
  number_of_questions: number;
  point_per_question: number;
}

export class CreateExamDto {
  title: string;
  code: string;
  duration_minutes: number;
  start_time?: Date;
  end_time?: Date;

  // Properti 'questions' yang lama diganti dengan dua ini (keduanya opsional)
  manual_questions?: ManualQuestionDto[];
  random_rules?: RandomRuleDto[];
}