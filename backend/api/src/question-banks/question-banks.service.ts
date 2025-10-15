// src/question-banks/question-banks.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { QuestionBank } from './entities/question-bank.entity';

@Injectable()
export class QuestionBanksService {
  constructor(
    @InjectRepository(QuestionBank)
    private readonly questionBankRepository: Repository<QuestionBank>,
  ) {}

  create(createQuestionBankDto: CreateQuestionBankDto) {
    const newBank = this.questionBankRepository.create(createQuestionBankDto);
    return this.questionBankRepository.save(newBank);
  }

  findAll() {
    return this.questionBankRepository.find(); // Mengambil semua bank soal
  }

  findOne(id: number) {
    return `This action returns a #${id} questionBank`;
  }

  update(id: number, updateQuestionBankDto: UpdateQuestionBankDto) {
    return `This action updates a #${id} questionBank`;
  }

  remove(id: number) {
    return `This action removes a #${id} questionBank`;
  }
}
