import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import express from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Mendapatkan laporan partisipan batch.
   * Format tabel untuk menampilkan nilai semua peserta di semua ujian.
   *
   * @param id ID Batch.
   */
  @Get('batch-participants/:id')
  getBatchParticipantReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchParticipantReport(id);
  }

  /**
   * Mendapatkan rata-rata nilai batch per ujian.
   * Digunakan untuk grafik performa batch.
   *
   * @param id ID Batch.
   */
  @Get('batch-averages/:id')
  getBatchAverageReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchAverageReport(id);
  }

  /**
   * Mendapatkan daftar unik ujian yang pernah dikerjakan oleh batch ini.
   * Digunakan untuk filter dropdown.
   *
   * @param id ID Batch.
   */
  @Get('batch-unique-exams/:id')
  getBatchUniqueExams(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchUniqueExams(id);
  }

  /**
   * Mendapatkan performa detail per ujian untuk batch tertentu.
   * Menampilkan nilai setiap siswa untuk satu ujian spesifik.
   *
   * @param batchId ID Batch.
   * @param examId ID Ujian.
   */
  @Get('batch-exam-performance/:batchId/:examId')
  getBatchExamPerformance(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.reportsService.getBatchExamPerformance(batchId, examId);
  }

  /**
   * Mengexport laporan batch ke file Excel (XLSX).
   * Mendukung opsi export nilai mentah (raw), ternormalisasi (normalized), atau keduanya.
   *
   * @param id ID Batch.
   * @param type Tipe export ('raw' | 'normalized' | 'both').
   * @param res Objek response express.
   */
  @Get('export/batch/:id')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportBatchReport(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: 'raw' | 'normalized' | 'both' = 'both',
    @Res() res: express.Response,
  ) {
    const buffer = await this.reportsService.exportBatchReport(id, type);

    // Kita tambahkan tanggal ke nama file
    const date = new Date().toISOString().split('T')[0];
    const fileName = `Laporan_Batch_${id}_${type}_${date}.xlsx`;

    // Content-Disposition menyuruh browser untuk men-download file
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);
  }
}
