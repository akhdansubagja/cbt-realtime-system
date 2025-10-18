import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exam } from './exam.entity';
import { QuestionBank } from '../../question-banks/entities/question-bank.entity';

@Entity({ name: 'exam_rules' })
export class ExamRule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @ManyToOne(() => QuestionBank, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_bank_id' })
  question_bank: QuestionBank;

  @Column()
  number_of_questions: number;

  @Column()
  point_per_question: number;
}