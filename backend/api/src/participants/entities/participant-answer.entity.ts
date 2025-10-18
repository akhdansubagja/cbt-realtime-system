import { ExamQuestion } from '../../exams/entities/exam-question.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Unique, // <-- Sebaiknya tambahkan ini juga
} from 'typeorm';
import { Participant } from './participant.entity';
import { ParticipantExamQuestion } from './participant-exam-question.entity';


@Unique(['participant', 'participant_exam_question'])
@Entity({ name: 'participant_answers' })
export class ParticipantAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Participant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @ManyToOne(() => ParticipantExamQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_exam_question_id' })
  participant_exam_question: ParticipantExamQuestion;

  @Column({ type: 'text', nullable: true }) // Izinkan null jika belum dijawab
  answer: string;

  @Column({ nullable: true })
  is_correct: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
