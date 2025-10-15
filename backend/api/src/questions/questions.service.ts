// src/questions/questions.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from './entities/question.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  create(createQuestionDto: CreateQuestionDto) {
    // ---- PERBAIKAN DI SINI ----
    const { bank_id, ...questionData } = createQuestionDto;

    const newQuestion = this.questionRepository.create({
      ...questionData,
      bank: { id: bank_id },
    });
    // -------------------------

    return this.questionRepository.save(newQuestion);
  }

  findAll() {
    return this.questionRepository.find({ relations: ['bank'] }); // Ambil data soal beserta bank soalnya
  }


  findOne(id: number) {
    return `This action returns a #${id} question`;
  }

  update(id: number, updateQuestionDto: UpdateQuestionDto) {
    return `This action updates a #${id} question`;
  }

  remove(id: number) {
    return `This action removes a #${id} question`;
  }
}
