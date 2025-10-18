import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Participant } from './participant.entity';
import { Question } from '../../questions/entities/question.entity';

@Entity({ name: 'participant_exam_questions' })
export class ParticipantExamQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Participant, (p) => p.generated_questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @ManyToOne(() => Question, { eager: true, onDelete: 'CASCADE' }) // eager: true akan otomatis mengambil data soal
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column()
  point: number;
}