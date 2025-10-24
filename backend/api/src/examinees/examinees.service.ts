import { Injectable } from '@nestjs/common';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Examinee } from './entities/examinee.entity';
import { Repository } from 'typeorm';

interface PaginationOptions {
  page: number;
  limit: number;
}

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

  async findAll(options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.examineeRepository.findAndCount({
      order: { name: 'ASC' },
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

  findOne(id: number) {
    // Ganti dari findOneBy menjadi findOne dengan opsi 'relations'
    return this.examineeRepository.findOne({
      where: { id },
      relations: [
        'participants', // Ambil semua sesi ujian peserta ini
        'participants.exam', // Untuk setiap sesi, ambil detail ujiannya (seperti judul)
      ],
    });
  }

  // --- LOGIKA UPDATE BARU ---
  async update(id: number, updateExamineeDto: UpdateExamineeDto) {
    await this.examineeRepository.update(id, updateExamineeDto);
    return this.examineeRepository.findOneBy({ id });
  }

  // --- LOGIKA DELETE BARU ---
  remove(id: number) {
    return this.examineeRepository.delete(id);
  }

  /**
   * Mengambil daftar sederhana semua peserta (hanya id dan nama).
   * Didesain untuk dropdown dan data selection, bukan tabel paginated.
   */
  async findAllSimple() {
    return this.examineeRepository.find({
      select: ['id', 'name'], // <-- Kunci efisiensi: hanya ambil kolom yang dibutuhkan
      order: { name: 'ASC' },
    });
  }
}
