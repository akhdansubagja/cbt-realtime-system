// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    // Di sini kita akan menambahkan hashing password, tapi untuk sekarang kita buat simpel dulu
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  // Metode lain (findAll, findOne, etc.) sudah dibuatkan oleh NestJS,
  // kita bisa implementasikan nanti jika perlu.
}