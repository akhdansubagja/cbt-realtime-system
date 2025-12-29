import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
  ) {}

  /**
   * Membuat batch baru di database.
   *
   * @param createBatchDto Data transfer object untuk pembuatan batch.
   * @returns Objek batch yang telah disimpan.
   */
  async create(createBatchDto: CreateBatchDto) {
    const batch = this.batchRepository.create(createBatchDto);
    return this.batchRepository.save(batch);
  }

  /**
   * Mengambil semua data batch, diurutkan berdasarkan ID secara ascending.
   * Menyertakan relasi dengan examinees (peserta).
   *
   * @returns Daftar semua batch.
   */
  findAll() {
    return this.batchRepository.find({
      order: {
        id: 'ASC',
      },
      relations: {
        examinees: true,
      },
    });
  }

  /**
   * Mencari satu batch berdasarkan ID.
   * Akan melempar error jika batch tidak ditemukan.
   *
   * @param id ID dari batch yang dicari.
   * @returns Detail batch beserta relasi examinees.
   * @throws NotFoundException Jika batch tidak ditemukan.
   */
  async findOne(id: number) {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: {
        examinees: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch dengan ID ${id} tidak ditemukan`);
    }

    return batch;
  }

  /**
   * Memperbarui data batch yang ada.
   *
   * @param id ID batch yang akan diupdate.
   * @param updateBatchDto Data baru untuk update.
   * @returns Batch yang telah berhasil diupdate.
   * @throws NotFoundException Jika batch tidak ditemukan.
   */
  async update(id: number, updateBatchDto: UpdateBatchDto) {
    const batch = await this.batchRepository.preload({
      id: id,
      ...updateBatchDto,
    });
    if (!batch) {
      throw new NotFoundException(`Batch dengan ID ${id} tidak ditemukan`);
    }
    return this.batchRepository.save(batch);
  }

  /**
   * Menghapus batch dari database.
   *
   * @param id ID batch yang akan dihapus.
   * @returns Pesan konfirmasi.
   */
  async remove(id: number) {
    const batch = await this.findOne(id);
    await this.batchRepository.remove(batch);
    return { message: `Batch dengan ID ${id} berhasil dihapus` };
  }
}
