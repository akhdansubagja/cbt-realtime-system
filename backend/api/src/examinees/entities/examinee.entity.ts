// src/examinees/entities/examinee.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'examinees' })
export class Examinee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true }) // Kita buat nama harus unik untuk menghindari duplikasi
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}