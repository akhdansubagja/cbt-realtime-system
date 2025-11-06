// backend/api/src/batches/entities/batch.entity.ts

import { Examinee } from 'src/examinees/entities/examinee.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'batches' })
export class Batch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Examinee, (examinee) => examinee.batch)
  examinees: Examinee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
