import {
  Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { ExamQuestion } from './exam-question.entity';
import { ExamRule } from './exam-rule.entity'; // <-- 1. IMPORT ExamRule

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

  @OneToMany(() => ExamQuestion, (examQuestion) => examQuestion.exam)
  exam_questions: ExamQuestion[];

  // --- 2. TAMBAHKAN RELASI YANG HILANG INI ---
  @OneToMany(() => ExamRule, (rule) => rule.exam)
  exam_rules: ExamRule[];
  // -----------------------------------------

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}