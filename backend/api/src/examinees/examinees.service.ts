import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Examinee } from './entities/examinee.entity';
import { Repository, ILike } from 'typeorm';
import { Batch } from 'src/batches/entities/batch.entity';
import { Express } from 'express'; // Pastikan ini ada
import { promises as fs } from 'fs'; // Untuk hapus file (async)
import { join } from 'path'; // Untuk path file

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class ExamineesService {
  constructor(
    @InjectRepository(Examinee)
    private readonly examineeRepository: Repository<Examinee>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
  ) {}

  async create(
    createExamineeDto: CreateExamineeDto,
    file: Express.Multer.File,
  ) {
    const { batch_id, ...restDto } = createExamineeDto;

    let batch: Batch | null = null;
    if (batch_id) {
      batch = await this.batchRepository.findOneBy({ id: batch_id });
      if (!batch) {
        // Anda bisa melempar error di sini jika batch_id tidak ditemukan
        // misalnya: new NotFoundException(`Batch with ID ${batch_id} not found`)
        // Tapi untuk sekarang kita biarkan null jika tidak ketemu
      }
    }

    const examinee = this.examineeRepository.create({
      ...restDto,
      batch: batch ?? undefined,
      avatar_url: file ? file.path : undefined,
    });

    return this.examineeRepository.save(examinee);
  }

  async findAll(options: PaginationOptions, search?: string) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const whereCondition = search ? { name: ILike(`%${search}%`) } : {};

    const [data, total] = await this.examineeRepository.findAndCount({
      where: whereCondition,
      order: { name: 'ASC' },
      take: limit,
      skip: skip,
      // V V V TAMBAHKAN INI V V V
      relations: {
        batch: true, // Ini akan melakukan JOIN ke tabel batch
      },
      // ^ ^ ^ BATAS PENAMBAHAN ^ ^ ^
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
  async update(
    id: number,
    updateExamineeDto: UpdateExamineeDto,
    file: Express.Multer.File,
  ) {
    const { batch_id, ...restDto } = updateExamineeDto;

    const existingExaminee = await this.examineeRepository.findOneBy({ id });
    if (!existingExaminee) {
      throw new NotFoundException(`Examinee with ID ${id} not found`);
    }

    let batch: Batch | null = null;
    if (batch_id) {
      batch = await this.batchRepository.findOneBy({ id: batch_id });
      if (!batch) {
        throw new NotFoundException(`Batch with ID ${batch_id} not found`);
      }
    }

    const updatePayload: Partial<Examinee> = {
      ...restDto,
      batch: batch ?? undefined,
    };

    if (file) {
      // 1. File baru diunggah, hapus file lama jika ada
      if (existingExaminee.avatar_url) {
        try {
          await fs.unlink(join(process.cwd(), existingExaminee.avatar_url));
        } catch (err) {
          console.error('Gagal menghapus file lama:', err.message);
        }
      }
      // 2. Set avatar_url ke path file baru
      updatePayload.avatar_url = file.path;
    }

    const examinee = await this.examineeRepository.preload({
      id: id,
      ...updatePayload,
      ...restDto,
      batch: batch ?? undefined, // <-- Perbarui relasi batch (gunakan undefined bukan null)
    });

    if (!examinee) {
      throw new NotFoundException(`Examinee with ID ${id} not found`);
    }

    return this.examineeRepository.save(examinee);
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
