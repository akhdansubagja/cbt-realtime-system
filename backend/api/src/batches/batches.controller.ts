import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

import { ExamineesService } from 'src/examinees/examinees.service';

@Controller('batches')
export class BatchesController {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly examineesService: ExamineesService,
  ) {}

  /**
   * Membuat batch ujian baru.
   *
   * @param createBatchDto Data untuk membuat batch baru.
   * @returns Objek batch yang baru dibuat.
   */
  @Post()
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }

  /**
   * Mengambil semua daftar batch.
   *
   * @returns Array dari objek batch.
   */
  @Get()
  findAll() {
    return this.batchesService.findAll();
  }

  /**
   * Mengambil satu batch berdasarkan ID.
   *
   * @param id ID batch (integer).
   * @returns Objek batch yang ditemukan.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.batchesService.findOne(id);
  }

  /**
   * Memperbarui data batch.
   *
   * @param id ID batch yang akan diperbarui.
   * @param updateBatchDto Data update batch.
   * @returns Objek batch yang telah diperbarui.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, updateBatchDto);
  }

  /**
   * Memperbarui status aktif/tidak aktif untuk semua peserta dalam batch.
   *
   * @param id ID batch.
   * @param body Objek berisi status `is_active`.
   * @returns Hasil update status peserta.
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { is_active: boolean },
  ) {
    return this.examineesService.updateBulkStatusByBatch(id, body.is_active);
  }

  /**
   * Menghapus batch berdasarkan ID.
   *
   * @param id ID batch yang akan dihapus.
   * @returns Pesan konfirmasi penghapusan.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.batchesService.remove(id);
  }
}
