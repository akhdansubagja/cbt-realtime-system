import { Batch } from "./batch";

export interface Examinee {
  id: number;
  name: string;
  batch_id: number;
  batch?: Batch | null;
  avatar_url: string | null;
  original_avatar_url?: string | null;
  workplace: string | null;
  is_active: boolean;
  uniqid: string;
  created_at: string;
  updated_at: string;
}
