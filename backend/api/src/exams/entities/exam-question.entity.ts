// src/exams/entities/exam-question.entity.ts

import { Question } from '../../questions/entities/question.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exam } from './exam.entity';

@Entity({ name: 'exam_questions' })
export class ExamQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  point: number;

  // Relasi ke Exam
  @ManyToOne(() => Exam, (exam) => exam.exam_questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  // Relasi ke Question
  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}