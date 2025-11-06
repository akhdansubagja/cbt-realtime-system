// frontend/src/types/participantHistory.ts
import { Exam } from './exam';

export interface ParticipantHistory {
  id: number;
  final_score: number | null;
  status: string;
  exam: Exam; // <- Kita embed tipe Exam di sini
  // Tambahkan properti lain jika diperlukan
}   