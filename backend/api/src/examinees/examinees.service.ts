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
import { CreateBulkExamineesDto } from './dto/create-bulk-examinees.dto';

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class ExamineesService {
  constructor(
    @InjectRepository(Examinee)
    public readonly examineeRepository: Repository<Examinee>,
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

  async findAll(options: PaginationOptions, search?: string, batchId?: number) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    // Buat object kondisi pencarian yang dinamis
    const whereCondition: any = {};

    if (search) {
      whereCondition.name = ILike(`%${search}%`);
    }

    // TAMBAHAN: Filter by Batch ID
    if (batchId) {
      whereCondition.batch = { id: batchId };
    }

    const [data, total] = await this.examineeRepository.findAndCount({
      where: whereCondition,
      order: { name: 'ASC' },
      take: limit,
      skip: skip,
      relations: {
        batch: true,
      },
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
  async remove(id: number) {
    // 1. Cari data peserta dulu sebelum dihapus untuk mendapatkan nama filenya
    const examinee = await this.examineeRepository.findOne({
      where: { id },
      select: ['id', 'avatar_url'], // Kita hanya butuh info url-nya
    });

    // 2. Jika peserta ada dan memiliki avatar, hapus file fisiknya
    if (examinee && examinee.avatar_url) {
      try {
        // Menggunakan join(process.cwd(), ...) sama seperti di fungsi update
        await fs.unlink(join(process.cwd(), examinee.avatar_url));
      } catch (err) {
        // Kita log error tapi jangan hentikan proses delete database
        console.error(
          `Gagal menghapus file fisik (mungkin sudah hilang): ${err.message}`,
        );
      }
    }

    // 3. Hapus data dari Database
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

  async createBulkWithAvatars(
    createBulkExamineesDto: CreateBulkExamineesDto,
    files: Array<Express.Multer.File>,
  ) {
    // PERBAIKAN: Baca dari '.names' bukan '["names[]"]'
    const { names, batch_id } = createBulkExamineesDto;

    let batch: Batch | null = null;
    if (batch_id) {
      batch = await this.batchRepository.findOneBy({ id: batch_id });
      if (!batch) {
        throw new NotFoundException(`Batch with ID ${batch_id} not found`);
      }
    }

    // Kode ini sekarang aman karena 'names' dijamin berupa array oleh DTO
    const newExaminees = names.map((name, index) => {
      const file = files[index];

      return this.examineeRepository.create({
        name: name,
        batch: batch ?? undefined,
        avatar_url: file ? file.path : undefined,
      });
    });

    return this.examineeRepository.save(newExaminees);
  }

  async updateBulkStatus(ids: number[], isActive: boolean) {
    if (!ids.length) return;

    await this.examineeRepository
      .createQueryBuilder()
      .update(Examinee)
      .set({ is_active: isActive })
      .where('id IN (:...ids)', { ids })
      .execute();

    return { message: 'Status updated successfully' };
  }

  async updateBulkStatusByBatch(batchId: number, isActive: boolean) {
    await this.examineeRepository
      .createQueryBuilder()
      .update(Examinee)
      .set({ is_active: isActive })
      .where('batch_id = :batchId', { batchId })
      .execute();

    return { message: 'Batch status updated successfully' };
  }
}
