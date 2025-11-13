import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
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

  @Get('batch-participants/:id')
  getBatchParticipantReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchParticipantReport(id);
  }

  @Get('batch-averages/:id')
  getBatchAverageReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchAverageReport(id);
  }

  @Get('batch-unique-exams/:id')
  getBatchUniqueExams(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchUniqueExams(id);
  }

  @Get('batch-exam-performance/:batchId/:examId')
  getBatchExamPerformance(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.reportsService.getBatchExamPerformance(batchId, examId);
  }

  @Get('export/batch/:id')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportBatchReport(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: express.Response,
  ) {
    const buffer = await this.reportsService.exportBatchReport(id);

    // Kita tambahkan tanggal ke nama file
    const date = new Date().toISOString().split('T')[0];
    const fileName = `Laporan_Batch_${id}_${date}.xlsx`;

    // Content-Disposition menyuruh browser untuk men-download file
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);
  }
}
