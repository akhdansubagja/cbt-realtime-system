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

  async create(createBatchDto: CreateBatchDto) {
    const batch = this.batchRepository.create(createBatchDto);
    return this.batchRepository.save(batch);
  }

  findAll() {
    // Ini akan mengambil semua data dari tabel 'batch'
    return this.batchRepository.find({
      order: {
        id: 'ASC', // Urutkan berdasarkan ID
      },
    });
  }

  async findOne(id: number) {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: {
        examinees: true, // <-- Ini PENTING: otomatis ambil data peserta terkait
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return batch;
  }
  update(id: number, updateBatchDto: UpdateBatchDto) {
    return `This action updates a #${id} batch`;
  }

  remove(id: number) {
    return `This action removes a #${id} batch`;
  }
}
