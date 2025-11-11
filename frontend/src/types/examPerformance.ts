// frontend/src/types/examPerformance.ts
// Untuk data dari /reports/batch-exam-performance/:batchId/:examId
export interface ExamPerformance {
  avatar_url: any;
  name: string; // Nama peserta
  score: string; // Skor (sebagai string dari query mentah)
}