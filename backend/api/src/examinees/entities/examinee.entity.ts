// src/examinees/entities/examinee.entity.ts
import { Participant } from 'src/participants/entities/participant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Batch } from 'src/batches/entities/batch.entity';

@Entity({ name: 'examinees' })
export class Examinee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true }) // Kita buat nama harus unik untuk menghindari duplikasi
  name: string;

  @OneToMany(() => Participant, (participant) => participant.examinee)
  participants: Participant[];

  @ManyToOne(() => Batch, (batch) => batch.examinees, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  
  @JoinColumn({ name: 'batch_id' }) // <-- Ini kuncinya
  batch: Batch;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
