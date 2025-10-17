// src/participants/entities/participant.entity.ts

import { Exam } from '../../exams/entities/exam.entity';
import { Examinee } from '../../examinees/entities/examinee.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export enum ParticipantStatus {
  STARTED = 'started',
  FINISHED = 'finished',
}

@Entity({ name: 'participants' })
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  // Relasi ke Examinee (Siapa yang mengerjakan)
  @ManyToOne(() => Examinee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examinee_id' })
  examinee: Examinee;

  // Relasi ke Exam (Ujian apa yang dikerjakan)
  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.STARTED,
  })
  status: ParticipantStatus;

  // --- TAMBAHKAN KOLOM INI ---
  @Column({ type: 'int', nullable: true }) // 'int' untuk integer, nullable karena awalnya kosong
  final_score: number;

  @Column({ type: 'timestamptz', nullable: true })
  start_time: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
