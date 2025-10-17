// src/examinees/examinees.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { Examinee } from './entities/examinee.entity';

@Injectable()
export class ExamineesService {
  constructor(
    @InjectRepository(Examinee)
    private readonly examineeRepository: Repository<Examinee>,
  ) {}

  create(createExamineeDto: CreateExamineeDto) {
    const newExaminee = this.examineeRepository.create(createExamineeDto);
    return this.examineeRepository.save(newExaminee);
  }

  findAll() {
    return this.examineeRepository.find({
      order: {
        name: 'ASC', // ASC = Ascending (A ke Z)
      },
    });
  }
}