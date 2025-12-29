// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Membuat user baru.
   * Password akan di-hash menggunakan bcrypt sebelum disimpan.
   */
  async create(createUserDto: CreateUserDto) {
    // 2. Hash password sebelum disimpan
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword, // <-- 3. Simpan password yang sudah di-hash
    });

    return this.userRepository.save(newUser);
  }

  /**
   * Mencari user berdasarkan username.
   * Digunakan untuk proses login.
   */
  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  // Metode lain (findAll, findOne, etc.) sudah dibuatkan oleh NestJS,
  // kita bisa implementasikan nanti jika perlu.
}
