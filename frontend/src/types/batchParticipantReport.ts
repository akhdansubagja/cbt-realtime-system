// frontend/src/types/batchParticipantReport.ts

import { UniqueExam } from "./uniqueExam"; // <-- Saya berasumsi path impor ini benar

// Tipe untuk satu entri skor (misal: Ujian A, nilai 90)
/**
 * Detail skor peserta untuk satu ujian tertentu.
 */
interface ParticipantScoreDetail {
  /** ID Ujian */
  examId: number;
  /** Skor akhir (null jika belum mengambil) */
  score: number | null;
  /** Skor mentah (total poin benar) */
  rawScore: number | null;
  /** Skor maksimal yang bisa dicapai */
  maxScore: number;
  /** Persentase nilai */
  percentage: number;
}

/**
 * Data lengkap performa satu peserta dalam batch.
 * Mencakup profil peserta dan rekap nilai dari semua ujian.
 */
export interface ParticipantScore {
  examinee: {
    id: number;
    name: string;
    avatar: string | null;
    original_avatar_url?: string | null; // Add fallback URL
    workplace: string | null;
  };
  examCount: number;
  totalScore: number;
  totalMaxScore: number;
  totalPercentageSum: number; // NEW
  averageScore: number;
  averagePercentage: number;
  scores: ParticipantScoreDetail[]; // Array skor individu
}

/**
 * Struktur respons utama API untuk laporan batch.
 * Berisi daftar ujian unik dalam batch dan daftar nilai peserta.
 */
export interface BatchParticipantReportData {
  uniqueExams: UniqueExam[];
  participantScores: ParticipantScore[];
}
