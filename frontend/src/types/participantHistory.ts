// frontend/src/types/participantHistory.ts
import { Exam } from "./exam";

/**
 * Interface untuk riwayat partisipasi ujian seorang peserta.
 * Mencatat skor akhir, waktu mulai/selesai, dan status pengerjaan.
 */
export interface ParticipantHistory {
  id: number;
  exam_id: number;
  final_score: number | null;
  status: string;
  start_time: string | null;
  finished_at: string | null;
  created_at: string; // Fallback date
  exam: Exam; // <- Kita embed tipe Exam di sini
  max_score?: number;
  percentage?: number;
  // Tambahkan properti lain jika diperlukan
}
