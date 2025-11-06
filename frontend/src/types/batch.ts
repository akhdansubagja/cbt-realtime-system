// frontend/src/types/batch.ts

import { Examinee } from './examinee';

export interface Batch {
  id: number;
  name: string;
  createdAt: string; // atau Date
  updatedAt: string; // atau Date
  examinees: Examinee[];
}