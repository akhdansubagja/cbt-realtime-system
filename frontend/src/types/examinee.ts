import { Batch } from "./batch";

/**
 * Interface untuk Peserta Ujian (Examinee).
 */
export interface Examinee {
  id: number;
  name: string;
  batch_id: number;
  /** Relasi ke Batch */
  batch?: Batch | null;
  avatar_url: string | null;
  original_avatar_url?: string | null;
  workplace: string | null;
  /** Status aktif/tidak akun peserta */
  is_active: boolean;
  /** ID Unik login peserta */
  uniqid: string;
  created_at: string;
  updated_at: string;
}
