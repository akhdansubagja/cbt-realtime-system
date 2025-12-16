import { Exam } from '../../exams/entities/exam.entity';
import { Examinee } from '../../examinees/entities/examinee.entity';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Column,
  OneToMany, // <-- Import OneToMany
  Unique, // <-- Import Unique
} from 'typeorm';
import { ParticipantExamQuestion } from './participant-exam-question.entity'; // <-- Import entity baru

export enum ParticipantStatus {
  STARTED = 'started',
  FINISHED = 'finished',
}

@Entity({ name: 'participants' })
@Unique(['examinee', 'exam', 'attempt_number']) // Composite Unique Key
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

  // --- NEW COLUMNS FOR MULTI-ATTEMPT ---
  @Column({ type: 'int', default: 1 })
  attempt_number: number;

  @Column({ type: 'boolean', default: false })
  is_retake: boolean;

  @Column({ type: 'text', nullable: true })
  admin_notes: string;
  // -------------------------------------

  @Column({ type: 'int', nullable: true })
  final_score: number;

  @Column({ type: 'timestamptz', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finished_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
