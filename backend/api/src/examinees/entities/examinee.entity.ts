// src/examinees/entities/examinee.entity.ts
import { Participant } from 'src/participants/entities/participant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'examinees' })
export class Examinee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true }) // Kita buat nama harus unik untuk menghindari duplikasi
  name: string;

  @OneToMany(() => Participant, (participant) => participant.examinee)
  participants: Participant[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}