import { Injectable } from '@nestjs/common';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionBank } from './entities/question-bank.entity';
import { Repository, Like, ILike, Not, IsNull } from 'typeorm';
import { Question } from 'src/questions/entities/question.entity';

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  has_image?: string;
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
    const { page, limit, search, has_image } = options;
    const skip = (page - 1) * limit;

    const where: any = { bank: { id: bankId } };

    if (search) {
      where.question_text = ILike(`%${search}%`);
    }

    if (has_image === 'true') {
      where.image_url = Not(IsNull());
      // If you also want to exclude empty strings:
      // where.image_url = And(Not(IsNull()), Not(""));
      // But usually checking Not(IsNull()) is enough if default is null.
      // Let's assume Not(IsNull()) and Not('') if possible, but TypeORM simple find options might be tricky for OR/AND combinations on same field without QueryBuilder.
      // For simplicity with simple find options:
      // If we need strict check for non-empty, we might need QueryBuilder.
      // Let's stick to simple find for now. If image_url is nullable, Not(IsNull()) is good.
    } else if (has_image === 'false') {
      where.image_url = IsNull();
    }

    const [data, total] = await this.questionRepository.findAndCount({
      where: where,
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
