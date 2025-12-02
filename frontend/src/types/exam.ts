// frontend/src/types/exam.ts
export interface Exam {
  id: number;
  title: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  // Tambahkan properti lain jika diperlukan
}
