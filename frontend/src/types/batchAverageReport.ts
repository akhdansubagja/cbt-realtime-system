// frontend/src/types/batchAverageReport.ts

export interface BatchAverageReport {
  examId: number; // <-- Tambahkan ID ujian
  examTitle: string;
  averageScore: string; // Ini adalah string karena kita menggunakan ROUND dan getRawMany
}
