import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { QuestionBanksService } from './question-banks.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';

@Controller('question-banks')
export class QuestionBanksController {
  constructor(private readonly questionBanksService: QuestionBanksService) {}

  /**
   * Membuat bank soal baru.
   *
   * @param createQuestionBankDto Data bank soal.
   */
  @Post()
  create(@Body() createQuestionBankDto: CreateQuestionBankDto) {
    return this.questionBanksService.create(createQuestionBankDto);
  }

  /**
   * Mengambil semua daftar bank soal.
   * Termasuk jumlah total soal di dalamnya.
   */
  @Get()
  findAll() {
    return this.questionBanksService.findAll();
  }

  /**
   * Mengambil detail bank soal berdasarkan ID.
   *
   * @param id ID bank soal.
   */
  /**
   * Mengambil detail bank soal berdasarkan ID.
   *
   * @param id ID bank soal.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionBanksService.findOne(id);
  }

  /**
   * Mengupdate data bank soal.
   *
   * @param id ID bank soal.
   * @param updateQuestionBankDto Data update.
   */
  /**
   * Mengupdate data bank soal.
   *
   * @param id ID bank soal.
   * @param updateQuestionBankDto Data update.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionBankDto: UpdateQuestionBankDto,
  ) {
    return this.questionBanksService.update(id, updateQuestionBankDto);
  }

  /**
   * Menghapus bank soal.
   *
   * @param id ID bank soal.
   */
  /**
   * Menghapus bank soal.
   *
   * @param id ID bank soal.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionBanksService.remove(id);
  }

  /**
   * Mencari soal-soal di dalam bank soal tertentu dengan pagination dan filter.
   *
   * @param id ID bank soal.
   * @param page Halaman saat ini.
   * @param limit Batas per halaman.
   * @param search Kata kunci pencarian.
   * @param has_image Filter jika soal memiliki gambar.
   */
  /**
   * Mencari soal-soal di dalam bank soal tertentu dengan pagination dan filter.
   *
   * @param id ID bank soal.
   * @param page Halaman saat ini.
   * @param limit Batas per halaman.
   * @param search Kata kunci pencarian.
   * @param has_image Filter jika soal memiliki gambar.
   */
  @Get(':id/questions')
  findQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('has_image') has_image?: string,
  ) {
    return this.questionBanksService.findQuestionsForBank(id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      has_image,
    });
  }

  /**
   * Mengexport soal-soal dalam bank soal ke file DOCX atau PDF.
   *
   * @param id ID bank soal.
   * @param res Objek response express.
   * @param format Format file (docx/pdf).
   * @param ids Daftar ID soal spesifik untuk diexport (opsional).
   */
  /**
   * Mengexport soal-soal dalam bank soal ke file DOCX atau PDF.
   *
   * @param id ID bank soal.
   * @param res Objek response express.
   * @param format Format file (docx/pdf).
   * @param ids Daftar ID soal spesifik untuk diexport (opsional).
   */
  @Get(':id/export')
  async export(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Query('format') format: 'docx' | 'pdf' = 'docx',
    @Query('ids') ids?: string,
  ) {
    const idList = ids ? ids.split(',').map(Number) : undefined;
    const buffer = await this.questionBanksService.exportQuestions(
      id,
      format,
      idList,
    );

    const filename = `question-bank-${id}.${format}`;
    const contentType =
      format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
