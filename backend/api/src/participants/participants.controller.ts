// src/participants/participants.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Delete,
  Patch,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { JoinExamDto } from './dto/join-exam.dto';
import { ParticipantGuard } from 'src/auth/guards/participant.guard';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  /**
   * Peserta bergabung ke ujian (Join Exam).
   * Verifikasi kode ujian dan validasi waktu.
   *
   * @param joinExamDto Data untuk bergabung (kode ujian, ID peserta).
   * @returns Token akses dan data sesi peserta.
   */
  @Post('join')
  joinExam(@Body() joinExamDto: JoinExamDto) {
    return this.participantsService.joinExam(joinExamDto);
  }

  /**
   * Mengambil daftar soal untuk peserta tertentu.
   * Mengembalikan snapshot soal yang sudah diacak (jika ada) atau membuatnya baru.
   *
   * @param id ID peserta (session ID).
   * @returns Daftar soal beserta sisa waktu.
   */
  @UseGuards(ParticipantGuard)
  @Get(':id/start')
  getExamQuestions(@Param('id') id: string) {
    return this.participantsService.getExamQuestions(+id);
  }

  /**
   * Menandai bahwa peserta MULAI mengerjakan ujian (start timer).
   *
   * @param id ID peserta.
   * @returns Data peserta dengan waktu mulai yang diset.
   */
  @UseGuards(ParticipantGuard)
  @Post(':id/begin')
  beginExam(@Param('id') id: string) {
    return this.participantsService.beginExam(+id);
  }

  /**
   * Menyelesaikan ujian peserta (Finish).
   * Menghitung skor akhir dan mengubah status menjadi FINISHED.
   *
   * @param id ID peserta.
   * @returns Data peserta yang telah selesai.
   */
  @UseGuards(ParticipantGuard)
  @Post(':id/finish')
  finishExam(@Param('id') id: string) {
    return this.participantsService.finishExam(+id);
  }

  /**
   * Mengambil jawaban yang telah dikirim oleh peserta.
   * Berguna untuk memulihkan state jawaban di frontend jika reload.
   *
   * @param id ID peserta.
   * @returns Map jawaban peserta.
   */
  @UseGuards(ParticipantGuard)
  @Get(':id/answers')
  getParticipantAnswers(@Param('id') id: string) {
    return this.participantsService.getParticipantAnswers(+id);
  }

  /**
   * Mengambil detail sesi peserta berdasarkan ID.
   *
   * @param id ID peserta.
   * @returns Detail peserta.
   */
  @Get(':id')
  @UseGuards(ParticipantGuard)
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(+id);
  }

  /**
   * Mengambil riwayat ujian seorang siswa (examinee).
   *
   * @param examineeId ID siswa.
   * @returns Daftar riwayat ujian.
   */
  @Get('by-examinee/:examineeId')
  findAllByExaminee(@Param('examineeId') examineeId: number) {
    return this.participantsService.findAllByExaminee(examineeId);
  }

  // --- ADMIN ENDPOINTS ---

  /**
   * Mengizinkan peserta untuk ujian ulang (Retake).
   * Membuat sesi baru dengan attempt number yang bertambah.
   *
   * @param id ID sesi peserta terakhir.
   * @returns Sesi peserta baru untuk retake.
   */
  @Post(':id/retake')
  allowRetake(@Param('id') id: string) {
    return this.participantsService.allowRetake(+id);
  }

  /**
   * Memperbarui data sesi peserta (Admin).
   * Misal: update status atau catatan admin.
   *
   * @param id ID peserta.
   * @param updateData Data update.
   * @returns Hasil update.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.participantsService.update(+id, updateData);
  }

  /**
   * Menghapus sesi peserta.
   *
   * @param id ID peserta.
   * @returns Hasil operasi delete.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.participantsService.remove(+id);
  }
}
