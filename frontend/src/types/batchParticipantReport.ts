// frontend/src/types/batchParticipantReport.ts

import { UniqueExam } from './uniqueExam'; // <-- Saya berasumsi path impor ini benar

// Tipe untuk satu entri skor (misal: Ujian A, nilai 90)
interface ParticipantScoreDetail {
  examId: number;
  score: number | null; // null jika peserta tidak mengambil ujian tsb
}

// Tipe baru untuk data per peserta (akan jadi 'baris' di tabel kita)
export interface ParticipantScore {
  examinee: {
    id: number;
    name: string;
    avatar: string | null;
  };
  examCount: number;
  totalScore: number;
  averageScore: number;
  scores: ParticipantScoreDetail[]; // Array skor individu
}

// Tipe data utama (wrapper) yang dikembalikan oleh API
// Kita ubah nama interface lama untuk mewakili seluruh objek respons
export interface BatchParticipantReportData {
  uniqueExams: UniqueExam[];
  participantScores: ParticipantScore[];
}