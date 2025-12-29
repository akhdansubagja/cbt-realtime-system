// frontend/src/types/batch.ts

import { Examinee } from "./examinee";

/**
 * Interface untuk data Batch (Gelombang/Angkatan).
 * Batch mengelompokkan peserta ujian.
 */
export interface Batch {
  /** ID unik batch */
  id: number;
  /** Nama batch */
  name: string;
  createdAt: string; // atau Date
  updatedAt: string; // atau Date
  /** Daftar peserta dalam batch */
  examinees: Examinee[];
}
