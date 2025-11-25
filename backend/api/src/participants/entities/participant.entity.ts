import { Exam } from '../../exams/entities/exam.entity';
import { Examinee } from '../../examinees/entities/examinee.entity';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
  OneToMany, // <-- Import OneToMany
} from 'typeorm';
import { ParticipantExamQuestion } from './participant-exam-question.entity'; // <-- Import entity baru

export enum ParticipantStatus {
  STARTED = 'started',
  FINISHED = 'finished',
}

@Entity({ name: 'participants' })
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Examinee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examinee_id' })
  examinee: Examinee;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  // --- TAMBAHKAN RELASI BARU INI ---
  @OneToMany(() => ParticipantExamQuestion, (peq) => peq.participant)
  generated_questions: ParticipantExamQuestion[];
  // --- AKHIR RELASI BARU ---

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.STARTED,
  })
  status: ParticipantStatus;

  @Column({ type: 'int', nullable: true })
  final_score: number;

  @Column({ type: 'timestamptz', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finished_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
