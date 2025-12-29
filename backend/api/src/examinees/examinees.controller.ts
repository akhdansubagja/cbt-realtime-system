// src/examinees/examinees.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { ExamineesService } from './examinees.service';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import File from 'multer';
import { CreateBulkWithAvatarsDto } from './dto/create-bulk-with-avatars.dto';

@Controller('examinees')
export class ExamineesController {
  constructor(private readonly examineesService: ExamineesService) {}

  /**
   * Membuat banyak peserta sekaligus beserta avatar mereka.
   *
   * @param createBulkWithAvatarsDto Data DTO yang berisi array peserta dalam format JSON string.
   * @param files Array file gambar (avatar) yang diunggah.
   * @returns Hasil penyimpanan data peserta.
   */
  @Post('bulk-with-avatars')
  @UseInterceptors(FilesInterceptor('avatars', 50)) // Menerima hingga 50 file
  createBulkWithAvatars(
    @Body() createBulkWithAvatarsDto: CreateBulkWithAvatarsDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.examineesService.createBulkWithAvatars(
      createBulkWithAvatarsDto,
      files,
    );
  }

  /**
   * Membuat peserta baru dengan avatar opsional.
   *
   * @param createExamineeDto Data peserta baru.
   * @param file File avatar yang diunggah (opsional).
   * @returns Data peserta yang baru dibuat.
   */
  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  create(
    @Body() createExamineeDto: CreateExamineeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examineesService.create(createExamineeDto, file);
  }

  /**
   * Mengambil daftar peserta dengan pagination dan filter.
   *
   * @param page Halaman yang diminta (default: 1).
   * @param limit Jumlah data per halaman (default: 10).
   * @param search Kata kunci pencarian nama.
   * @param batch_id Filter berdasarkan ID Batch.
   * @param is_active Filter berdasarkan status aktif (true/false).
   * @returns Objek pagination yang berisi data dan metadata.
   */
  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string,
    @Query('batch_id') batch_id?: string,
    @Query('is_active') is_active?: string,
  ) {
    return this.examineesService.findAll(
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
      search,
      batch_id ? parseInt(batch_id, 10) : undefined,
      is_active,
    );
  }

  /**
   * Memperbarui status (aktif/tidak aktif) untuk banyak peserta sekaligus.
   *
   * @param body Objek berisi array ID peserta dan status baru.
   * @returns Pesan konfirmasi update.
   */
  @Patch('bulk/status')
  updateBulkStatus(@Body() body: { ids: number[]; is_active: boolean }) {
    return this.examineesService.updateBulkStatus(body.ids, body.is_active);
  }

  /**
   * Mengambil semua peserta sederhana (ID dan Nama) yang aktif.
   * Cocok untuk dropdown seleksi.
   *
   * @returns Array objek peserta sederhana.
   */
  @Get('all/simple')
  findAllSimple() {
    // Filter hanya yang aktif untuk dropdown login
    return this.examineesService.examineeRepository.find({
      where: { is_active: true },
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examineesService.findOne(id);
  }

  /**
   * Memperbarui data peserta berdasarkan ID.
   *
   * @param id ID peserta.
   * @param updateExamineeDto Data update peserta.
   * @param file File avatar baru (opsional).
   * @returns Data peserta yang telah diperbarui.
   */
  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamineeDto: UpdateExamineeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examineesService.update(id, updateExamineeDto, file);
  }

  /**
   * Menghapus peserta berdasarkan ID.
   *
   * @param id ID peserta.
   * @returns Pesan konfirmasi penghapusan.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examineesService.remove(id);
  }
}
