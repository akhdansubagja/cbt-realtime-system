// frontend/src/types/batchAverageReport.ts

/**
 * Interface untuk laporan rata-rata nilai batch per ujian.
 * Digunakan pada grafik diagram batang di detail batch.
 */
export interface BatchAverageReport {
  /** ID Ujian */
  examId: number;
  /** Judul Ujian */
  examTitle: string;
  /** Nilai Rata-rata (String karena decimal dari DB) */
  averageScore: string;
}
