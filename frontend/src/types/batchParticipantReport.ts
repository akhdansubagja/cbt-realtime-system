// frontend/src/types/batchParticipantReport.ts

export interface BatchParticipantReport {
  examinee_id: number;
  examinee_name: string;
  examCount: string; // Tipe-nya string karena dari kueri mentah (raw query)
  totalScore: string; // Sama, ini juga string
}