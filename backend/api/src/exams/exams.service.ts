// src/exams/exams.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { ExamRule } from './entities/exam-rule.entity';
import { Participant } from 'src/participants/entities/participant.entity';
import { ParticipantAnswer } from 'src/participants/entities/participant-answer.entity';
import { ParticipantStatus } from 'src/participants/entities/participant.entity';
import { ParticipantsService } from 'src/participants/participants.service';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(ExamRule)
    private readonly examRuleRepository: Repository<ExamRule>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantAnswer)
    private readonly answerRepository: Repository<ParticipantAnswer>,
  ) {}

  /**
   * Membuat ujian baru beserta soal manual dan aturan pengacakan soal.
   *
   * @param createExamDto Data ujian baru.
   * @returns Objek ujian yang disimpan.
   */
  async create(createExamDto: CreateExamDto) {
    // 1. Buat dan simpan data ujian utama
    const newExam = this.examRepository.create({
      title: createExamDto.title,
      code: createExamDto.code,
      duration_minutes: createExamDto.duration_minutes,
      start_time: createExamDto.start_time,
      end_time: createExamDto.end_time,
    });
    const savedExam = await this.examRepository.save(newExam);

    // 2. Jika ada soal manual, simpan ke tabel 'exam_questions'
    if (
      createExamDto.manual_questions &&
      createExamDto.manual_questions.length > 0
    ) {
      const manualQuestions = createExamDto.manual_questions.map((q) => {
        return this.examQuestionRepository.create({
          exam: savedExam,
          question: { id: q.question_id },
          point: q.point,
        });
      });
      await this.examQuestionRepository.save(manualQuestions);
    }

    // 3. Jika ada aturan acak, simpan ke tabel 'exam_rules'
    if (createExamDto.random_rules && createExamDto.random_rules.length > 0) {
      const randomRules = createExamDto.random_rules.map((r) => {
        return this.examRuleRepository.create({
          exam: savedExam,
          question_bank: { id: r.question_bank_id },
          number_of_questions: r.number_of_questions,
          point_per_question: r.point_per_question,
        });
      });
      await this.examRuleRepository.save(randomRules);
    }

    // Kembalikan data ujian utama
    return savedExam;
  }

  /**
   * Memperbarui data ujian, termasuk soal manual dan aturan acak jika disertakan.
   *
   * @param id ID ujian.
   * @param updateExamDto Data update.
   * @returns Ujian yang telah diperbarui.
   */
  async update(id: number, updateExamDto: UpdateExamDto) {
    // 1. Update data utama ujian
    await this.examRepository.update(id, {
      title: updateExamDto.title,
      code: updateExamDto.code,
      duration_minutes: updateExamDto.duration_minutes,
      start_time: updateExamDto.start_time,
      end_time: updateExamDto.end_time,
    });

    const exam = { id }; // Objek referensi

    // 2. Update soal manual (HANYA JIKA DIKIRIM DI DTO)
    if (updateExamDto.manual_questions !== undefined) {
      // Hapus yang lama
      await this.examQuestionRepository.delete({ exam: { id } });

      // Masukkan yang baru jika array tidak kosong
      if (updateExamDto.manual_questions.length > 0) {
        const manualQuestions = updateExamDto.manual_questions.map((q) =>
          this.examQuestionRepository.create({
            exam,
            question: { id: q.question_id },
            point: q.point,
          }),
        );
        await this.examQuestionRepository.save(manualQuestions);
      }
    }

    // 3. Update aturan acak (HANYA JIKA DIKIRIM DI DTO)
    if (updateExamDto.random_rules !== undefined) {
      // Hapus yang lama
      await this.examRuleRepository.delete({ exam: { id } });

      // Masukkan yang baru jika array tidak kosong
      if (updateExamDto.random_rules.length > 0) {
        const randomRules = updateExamDto.random_rules.map((r) =>
          this.examRuleRepository.create({
            exam,
            question_bank: { id: r.question_bank_id },
            ...r,
          }),
        );
        await this.examRuleRepository.save(randomRules);
      }
    }

    return this.findOne(id);
  }

  /**
   * Menghapus ujian.
   * Karena menggunakan CASCADE on delete di database, relasi akan terhapus otomatis.
   *
   * @param id ID ujian.
   * @returns Hasil delete.
   * @throws NotFoundException Jika ujian tidak ditemukan.
   */
  async remove(id: number) {
    // Dengan onDelete: 'CASCADE', menghapus exam akan otomatis menghapus semua relasinya
    const result = await this.examRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ujian dengan ID ${id} tidak ditemukan`);
    }
    return result;
  }

  /**
   * Mengambil semua data ujian diurutkan dari yang terbaru.
   *
   * @returns Daftar ujian.
   */
  findAll() {
    return this.examRepository.find({ order: { id: 'DESC' } });
  }

  /**
   * Mengambil detail lengkap satu ujian.
   * Termasuk soal manual dan aturan pengacakan bank soal.
   *
   * @param id ID ujian.
   * @returns Detail ujian.
   */
  async findOne(id: number) {
    // Tambahkan relasi yang lebih dalam untuk mengambil semua detail
    return this.examRepository.findOne({
      where: { id },
      relations: [
        'exam_questions', // Ambil data soal manual
        'exam_questions.question', // Ambil detail dari setiap soal manual
        'exam_rules', // Ambil data aturan acak
        'exam_rules.question_bank', // Ambil detail bank soal dari setiap aturan
      ],
    });
  }

  /**
   * Mendapatkan daftar peserta untuk suatu ujian beserta skor sementara (progress).
   *
   * @param examId ID ujian.
   * @returns Daftar peserta dengan skor dan status terkini.
   */
  async getParticipantsForExam(examId: number) {
    // 1. Ambil semua peserta, termasuk 'start_time' dan 'exam' untuk kalkulasi
    const participants = await this.participantRepository.find({
      where: { exam: { id: examId } },
      relations: ['examinee', 'examinee.batch', 'exam'], // <-- Ambil relasi 'exam' dan 'batch'
      select: [
        'id',
        'examinee',
        'final_score',
        'status',
        'start_time',
        'finished_at',
        'exam',
      ], // <-- Ambil 'finished_at'
    });

    // 2. Untuk setiap peserta, hitung skor dan tentukan status aktualnya
    const participantsWithDetails = await Promise.all(
      participants.map(async (p) => {
        let currentScore: number | null = null;
        let actualStatus = p.status; // Ambil status dari DB sebagai default

        // Hanya proses lebih lanjut jika peserta pernah memulai
        if (p.start_time) {
          // --- LOGIKA BARU UNTUK CEK WAKTU HABIS ---
          if (p.status === ParticipantStatus.STARTED) {
            // Hanya cek jika statusnya masih started
            const now = Date.now();
            const sessionStartTime = new Date(p.start_time).getTime();
            const sessionDurationInMs = p.exam.duration_minutes * 60 * 1000;
            const sessionEndTime = sessionStartTime + sessionDurationInMs;
            const scheduledEndTime = p.exam.end_time
              ? new Date(p.exam.end_time).getTime()
              : Infinity;
            const actualEndTime = Math.min(sessionEndTime, scheduledEndTime);

            if (now > actualEndTime) {
              actualStatus = ParticipantStatus.FINISHED; // Tandai sebagai selesai jika waktu habis
              // Opsional: Jika ingin auto-submit saat admin membuka monitor
              // this.participantsService.finishExam(p.id); // Perlu inject ParticipantsService
            }
          }
          // --- AKHIR LOGIKA BARU ---

          // Hitung skor hanya jika belum selesai ATAU baru saja ditandai selesai karena waktu habis
          if (
            actualStatus === ParticipantStatus.STARTED ||
            (p.status === ParticipantStatus.STARTED &&
              actualStatus === ParticipantStatus.FINISHED)
          ) {
            const correctAnswers = await this.answerRepository.find({
              where: { participant: { id: p.id }, is_correct: true },
              relations: ['participant_exam_question'],
            });
            currentScore = correctAnswers.reduce(
              (sum, answer) =>
                sum + (answer.participant_exam_question?.point || 0),
              0,
            );
          } else if (p.final_score !== null) {
            // Jika memang sudah selesai dari DB, gunakan skor final
            currentScore = p.final_score;
          }
        }

        // Kembalikan objek dengan skor terhitung dan status AKTUAL
        return { ...p, current_score: currentScore, status: actualStatus }; // Gunakan status aktual
      }),
    );

    // Urutkan berdasarkan skor (DESC), lalu durasi (ASC)
    participantsWithDetails.sort((a, b) => {
      const scoreDiff = (b.current_score ?? 0) - (a.current_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;

      // Tie-breaker: Duration (shorter is better)
      let durationA = Infinity;
      if (
        a.status === ParticipantStatus.FINISHED &&
        a.finished_at &&
        a.start_time
      ) {
        durationA =
          new Date(a.finished_at).getTime() - new Date(a.start_time).getTime();
      }

      let durationB = Infinity;
      if (
        b.status === ParticipantStatus.FINISHED &&
        b.finished_at &&
        b.start_time
      ) {
        durationB =
          new Date(b.finished_at).getTime() - new Date(b.start_time).getTime();
      }

      return durationA - durationB;
    });

    return participantsWithDetails;
  }
}
