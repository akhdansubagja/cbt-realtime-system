import { Injectable } from '@nestjs/common';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionBank } from './entities/question-bank.entity';
import { Repository } from 'typeorm';
import { Question } from 'src/questions/entities/question.entity';


interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class QuestionBanksService {
  constructor(
    @InjectRepository(QuestionBank)
    private readonly questionBankRepository: Repository<QuestionBank>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  create(createQuestionBankDto: CreateQuestionBankDto) {
    const newBank = this.questionBankRepository.create(createQuestionBankDto);
    return this.questionBankRepository.save(newBank);
  }

  findAll() {
    return this.questionBankRepository.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    // Tambahkan 'relations' untuk mengambil semua soal yang terhubung
    return this.questionBankRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
  }

  async findQuestionsForBank(bankId: number, options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.questionRepository.findAndCount({
      where: { bank: { id: bankId } },
      order: { id: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  // --- TAMBAHKAN LOGIKA UPDATE DI SINI ---
  async update(id: number, updateQuestionBankDto: UpdateQuestionBankDto) {
    // Perbarui data di database
    await this.questionBankRepository.update(id, updateQuestionBankDto);
    // Ambil dan kembalikan data yang sudah diperbarui
    return this.questionBankRepository.findOneBy({ id });
  }

  // --- TAMBAHKAN LOGIKA DELETE DI SINI ---
  async remove(id: number) {
    // Hapus data dari database
    return this.questionBankRepository.delete(id);
  }
}