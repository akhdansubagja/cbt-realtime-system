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
    const newQuestion = this.questionRepository.create({
      ...createQuestionDto,
      bank: { id: createQuestionDto.bank_id },
    });
    return this.questionRepository.save(newQuestion);
  }

  findAll() {
    return this.questionRepository.find({ relations: ['bank'] });
  }

  findOne(id: number) {
    return this.questionRepository.findOneBy({ id });
  }

  // --- LOGIKA UPDATE BARU ---
  async update(id: number, updateQuestionDto: UpdateQuestionDto) {
    // Kita perlu menangani properti 'bank_id' secara terpisah jika ada
    const { bank_id, ...rest } = updateQuestionDto;
    const payload: Partial<Question> = { ...rest };
    if (bank_id) {
      payload.bank = { id: bank_id } as any;
    }
    
    await this.questionRepository.update(id, payload as any);
    return this.questionRepository.findOneBy({ id });
  }

  // --- LOGIKA DELETE BARU ---
  remove(id: number) {
    return this.questionRepository.delete(id);
  }
}