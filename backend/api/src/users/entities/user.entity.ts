// src/users/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' }) // Menentukan nama tabel di database
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true }) // Username harus unik
  username: string;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}