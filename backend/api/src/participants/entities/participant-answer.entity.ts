import { ExamQuestion } from '../../exams/entities/exam-question.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn, // <-- Sebaiknya tambahkan ini juga
} from 'typeorm';
import { Participant } from './participant.entity';

@Entity({ name: 'participant_answers' })
export class ParticipantAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Participant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @ManyToOne(() => ExamQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_question_id' })
  exam_question: ExamQuestion;

  @Column({ type: 'text', nullable: true }) // Izinkan null jika belum dijawab
  answer: string;

  @Column({ nullable: true })
  is_correct: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}