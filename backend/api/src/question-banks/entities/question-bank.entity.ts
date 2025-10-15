// src/question-banks/entities/question-bank.entity.ts

import { Question } from '../../questions/entities/question.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'question_banks' }) // Nama tabel di database: question_banks
export class QuestionBank {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true }) // Deskripsi bisa panjang dan opsional
  description: string;

  @OneToMany(() => Question, (question) => question.bank)
  questions: Question[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}