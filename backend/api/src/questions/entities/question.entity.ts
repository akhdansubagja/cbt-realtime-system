// src/questions/entities/question.entity.ts

import { QuestionBank } from '../../question-banks/entities/question-bank.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Enum untuk tipe soal
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  ESSAY = 'essay',
}

@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  // Relasi ke QuestionBank
  @ManyToOne(() => QuestionBank, (bank) => bank.questions, {
    onDelete: 'CASCADE', // Jika bank soal dihapus, soal di dalamnya juga terhapus
  })
  @JoinColumn({ name: 'bank_id' }) // Nama kolom foreign key di database
  bank: QuestionBank;

  @Column()
  question_text: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  question_type: QuestionType;

  @Column({ type: 'jsonb', nullable: true }) // Untuk menyimpan pilihan ganda A, B, C, D
  options: any; // e.g., [{ key: 'A', text: '...' }, { key: 'B', text: '...' }]

  @Column({ nullable: true })
  correct_answer: string; // e.g., 'A'

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}