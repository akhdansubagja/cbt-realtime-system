// frontend/src/types/batchAverageReport.ts

export interface BatchAverageReport {
  examTitle: string;
  averageScore: string; // Ini adalah string karena kita menggunakan ROUND dan getRawMany
}