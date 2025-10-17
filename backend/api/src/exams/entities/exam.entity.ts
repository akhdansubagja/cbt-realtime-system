// src/exams/entities/exam.entity.ts

import { ExamQuestion } from './exam-question.entity'; // Akan kita buat setelah ini
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'exams' })
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  code: string;

  @Column()
  duration_minutes: number;

  @Column({ type: 'timestamptz', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_time: Date;
  // Relasi ke tabel pivot ExamQuestion
  @OneToMany(() => ExamQuestion, (examQuestion) => examQuestion.exam)
  exam_questions: ExamQuestion[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
