// frontend/src/types/uniqueExam.ts
// Untuk data dari /reports/batch-unique-exams/:id
/**
 * Interface ringkas untuk daftar ujian unik dalam laporan batch.
 * Data dari /reports/batch-unique-exams/:id
 */
export interface UniqueExam {
  id: number;
  title: string;
  shortTitle: string;
}
