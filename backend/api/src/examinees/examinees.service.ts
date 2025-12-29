import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Examinee } from './entities/examinee.entity';
import { Repository, ILike } from 'typeorm';
import { Batch } from 'src/batches/entities/batch.entity';
import { Express } from 'express'; // Pastikan ini ada
import { promises as fs } from 'fs'; // Untuk hapus file (async)
import { join, dirname, extname } from 'path'; // Untuk path file
import { CreateBulkExamineesDto } from './dto/create-bulk-examinees.dto';
import { CreateBulkWithAvatarsDto } from './dto/create-bulk-with-avatars.dto';
import sharp from 'sharp';

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

  /**
   * Menghasilkan ID unik untuk peserta.
   * Format: YYYYMMDD-XXXX (4 karakter acak).
   *
   * @returns String ID unik.
   */
  private generateUniqId(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    // Generate 4 random alphanumeric characters
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    return `${dateStr}-${randomSuffix}`;
  }

  /**
   * Membuat peserta baru dan menyimpannya ke database.
   *
   * @param createExamineeDto Data transfer object pembuatan peserta.
   * @param file File avatar yang diunggah (opsional).
   * @returns Peserta yang baru dibuat.
   */
  async create(
    createExamineeDto: CreateExamineeDto,
    file: Express.Multer.File,
  ) {
    const { batch_id, ...restDto } = createExamineeDto;

    let batch: Batch | null = null;
    if (batch_id) {
      batch = await this.batchRepository.findOneBy({ id: batch_id });
      if (!batch) {
        // Logika jika batch tidak ditemukan
      }
    }

    const examinee = this.examineeRepository.create({
      ...restDto,
      batch: batch ?? undefined,
      avatar_url: undefined,
      original_avatar_url: undefined,
      uniqid: this.generateUniqId(),
    });

    // Handle Image Processing
    if (file) {
      const processed = await this.processAvatar(file);
      examinee.avatar_url = processed.thumbnailPath; // Thumbnail untuk UI
      examinee.original_avatar_url = processed.originalPath; // Original untuk PDF
    }

    return this.examineeRepository.save(examinee);
  }

  /**
   * Mengambil data peserta dengan pagination dan filter.
   *
   * @param options Opsi pagination (page, limit).
   * @param search Kata kunci pencarian (nama).
   * @param batchId Filter ID Batch.
   * @param isActive Filter status aktif.
   * @returns Data peserta dan total count.
   */
  async findAll(
    options: PaginationOptions,
    search?: string,
    batchId?: number,
    isActive?: string,
  ) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (search) {
      whereCondition.name = ILike(`%${search}%`);
    }

    // Filter by Batch ID
    if (batchId) {
      whereCondition.batch = { id: batchId };
    }

    // Filter by Status
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      whereCondition.is_active = isActive === 'true';
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

  /**
   * Mencari peserta berdasarkan ID.
   * Menyertakan relasi partisipasi ujian dan batch.
   *
   * @param id ID peserta.
   * @returns Data peserta detail.
   */
  findOne(id: number) {
    return this.examineeRepository.findOne({
      where: { id },
      relations: [
        'participants', // Ambil semua sesi ujian peserta ini
        'participants.exam', // Untuk setiap sesi, ambil detail ujiannya (seperti judul)
        'batch', // <-- Tambahkan relasi batch
      ],
    });
  }

  /**
   * Memperbarui data peserta.
   *
   * @param id ID peserta.
   * @param updateExamineeDto Data update peserta.
   * @param file File avatar baru (opsional).
   * @returns Data peserta yang telah diperbarui.
   * @throws NotFoundException Jika peserta tidak ditemukan.
   */
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
        await this.deleteFileSafely(existingExaminee.avatar_url);
      }
      if (existingExaminee.original_avatar_url) {
        await this.deleteFileSafely(existingExaminee.original_avatar_url);
      }

      // 2. Proses file baru
      const processed = await this.processAvatar(file);
      updatePayload.avatar_url = processed.thumbnailPath;
      updatePayload.original_avatar_url = processed.originalPath;
    }

    const examinee = await this.examineeRepository.preload({
      id: id,
      ...updatePayload,
      ...restDto,
      batch: batch ?? undefined,
    });

    if (!examinee) {
      throw new NotFoundException(`Examinee with ID ${id} not found`);
    }

    return this.examineeRepository.save(examinee);
  }

  /**
   * Menghapus peserta beserta file avatar fisiknya.
   *
   * @param id ID peserta yang akan dihapus.
   * @returns Hasil operasi delete.
   */
  async remove(id: number) {
    // 1. Cari data peserta dulu sebelum dihapus untuk mendapatkan nama filenya
    const examinee = await this.examineeRepository.findOne({
      where: { id },
      select: ['id', 'avatar_url', 'original_avatar_url'], // Kita hanya butuh info url-nya
    });

    // 2. Jika peserta ada dan memiliki avatar, hapus file fisiknya
    if (examinee) {
      if (examinee.avatar_url) {
        await this.deleteFileSafely(examinee.avatar_url);
      }
      if (examinee.original_avatar_url) {
        await this.deleteFileSafely(examinee.original_avatar_url);
      }
    }

    // 3. Hapus data dari Database
    return this.examineeRepository.delete(id);
  }

  /**
   * Mengambil daftar sederhana semua peserta (hanya id dan nama).
   * Didesain untuk dropdown dan data selection, bukan tabel paginated.
   *
   * @returns Daftar peserta (id, name).
   */
  async findAllSimple() {
    return this.examineeRepository.find({
      select: ['id', 'name'], // <-- Kunci efisiensi: hanya ambil kolom yang dibutuhkan
      order: { name: 'ASC' },
    });
  }

  /**
   * Membuat peserta secara massal beserta avatar.
   *
   * @param createBulkWithAvatarsDto DTO data massal.
   * @param files Array file avatar.
   * @returns Array peserta yang berhasil disimpan.
   */
  async createBulkWithAvatars(
    createBulkWithAvatarsDto: CreateBulkWithAvatarsDto,
    files: Array<Express.Multer.File>,
  ) {
    const { data, batch_id } = createBulkWithAvatarsDto;

    let parsedData: { name: string; fileIndex?: number }[] = [];
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      throw new BadRequestException('Invalid JSON data format');
    }

    let batch: Batch | null = null;
    if (batch_id) {
      const bId = Number(batch_id);
      batch = await this.batchRepository.findOneBy({ id: bId });
      if (!batch) {
        throw new NotFoundException(`Batch with ID ${batch_id} not found`);
      }
    }

    const savedExaminees: Examinee[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const item = parsedData[i];

      // Prepare examinee object
      let avatarPath: string | undefined = undefined;
      let originalAvatarPath: string | undefined = undefined;

      if (item.fileIndex !== undefined && files[item.fileIndex]) {
        const processed = await this.processAvatar(files[item.fileIndex]);
        avatarPath = processed.thumbnailPath;
        originalAvatarPath = processed.originalPath;
      }

      const ex = this.examineeRepository.create({
        name: item.name,
        batch: batch ?? undefined,
        avatar_url: avatarPath,
        original_avatar_url: originalAvatarPath,
        uniqid: this.generateUniqId(),
      });

      savedExaminees.push(ex);
    }

    return this.examineeRepository.save(savedExaminees);
  }

  /**
   * Melakukan update status aktif/tidak aktif pada banyak peserta sekaligus.
   *
   * @param ids Array ID peserta.
   * @param isActive Status baru (boolean).
   * @returns Pesan sukses.
   */
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

  /**
   * Mengupdate status seluruh peserta dalam satu batch.
   *
   * @param batchId ID Batch.
   * @param isActive Status baru.
   * @returns Pesan sukses.
   */
  async updateBulkStatusByBatch(batchId: number, isActive: boolean) {
    await this.examineeRepository
      .createQueryBuilder()
      .update(Examinee)
      .set({ is_active: isActive })
      .where('batch_id = :batchId', { batchId })
      .execute();

    return { message: 'Batch status updated successfully' };
  }

  /**
   * Memproses file avatar menggunakan Sharp (resize dan save).
   *
   * @param file File dari multer.
   * @returns Object path original dan thumbnail.
   */
  private async processAvatar(
    file: Express.Multer.File,
  ): Promise<{ originalPath: string; thumbnailPath: string }> {
    // 1. Tentukan path
    // File asli dari multer (file.path) biasanya di 'uploads/...'
    const originalPath = file.path;

    // Kita buat thumbnail path. Misal: uploads/thumbnails/filename-thumb.ext
    // Pastikan direktori ada? Biasanya multer settingan di module.
    // Kita asumsikan folder upload root sudah ada.
    // Untuk amannya, kita taruh thumbnail di folder yang sama tapi suffix beda
    const dir = dirname(originalPath);
    const ext = extname(originalPath);
    const filename = originalPath.split('/').pop()?.replace(ext, '') || 'file';
    const thumbnailFilename = `${filename}-thumb${ext}`;
    const thumbnailPath = join(dir, thumbnailFilename);

    try {
      // Sharp process
      await sharp(originalPath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 }) // Convert to jpeg for consistency/compression or keep original format
        .toFile(thumbnailPath);

      return {
        originalPath, // Simpan path asli
        thumbnailPath, // Simpan path thumbnail
      };
    } catch (error) {
      console.error('Gagal memproses gambar dengan sharp:', error);
      // Fallback: gunakan original untuk keduanya jika gagal resize
      return {
        originalPath,
        thumbnailPath: originalPath,
      };
    }
  }

  /**
   * Menghapus file secara aman (tidak error jika file tidak ada).
   *
   * @param path Path file yang akan dihapus.
   */
  private async deleteFileSafely(path: string) {
    try {
      await fs.unlink(join(process.cwd(), path));
    } catch (err) {
      // Ignore error if file missing
    }
  }
}
