import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  /**
   * Membuat ujian baru.
   *
   * @param createExamDto Data transfer object untuk ujian baru.
   * @returns Data ujian yang baru dibuat.
   */
  @Post()
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  /**
   * Mengambil semua daftar ujian.
   *
   * @returns Array ujian.
   */
  @Get()
  findAll() {
    return this.examsService.findAll();
  }

  /**
   * Mengambil detail ujian berdasarkan ID.
   *
   * @param id ID ujian.
   * @returns Detail ujian.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(+id);
  }

  /**
   * Memperbarui data ujian.
   *
   * @param id ID ujian yang akan diupdate.
   * @param updateExamDto Data update ujian.
   * @returns Ujian yang telah diperbarui.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(+id, updateExamDto);
  }

  /**
   * Menghapus ujian berdasarkan ID.
   *
   * @param id ID ujian.
   * @returns Hasil operasi delete.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examsService.remove(+id);
  }

  /**
   * Mendapatkan daftar peserta dan skor sementara untuk ujian tertentu.
   * Endpoint ini digunakan untuk monitoring progress peserta.
   *
   * @param id ID ujian.
   * @returns Daftar peserta beserta skor dan status pengerjaan saat ini.
   */
  @Get(':id/participants')
  getParticipantsForExam(@Param('id') id: string) {
    return this.examsService.getParticipantsForExam(+id);
  }
}
