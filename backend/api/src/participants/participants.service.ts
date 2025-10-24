// src/participants/participants.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from 'src/exams/entities/exam.entity';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Repository, Not, In } from 'typeorm';
import { JoinExamDto } from './dto/join-exam.dto';
import { Participant, ParticipantStatus } from './entities/participant.entity';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { ExamQuestion } from 'src/exams/entities/exam-question.entity';
import { ParticipantExamQuestion } from './entities/participant-exam-question.entity';
import { ExamRule } from 'src/exams/entities/exam-rule.entity';
import { Question } from 'src/questions/entities/question.entity';
import { LiveExamGateway } from 'src/live-exam/live-exam.gateway';
import { AuthService } from 'src/auth/auth.service';

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elemen
  }
  return array;
}

// Define or import SubmitAnswerPayload type
interface SubmitAnswerPayload {
  participantId: number;
  examQuestionId: number;
  answer: string;
}

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Examinee)
    private readonly examineeRepository: Repository<Examinee>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ParticipantAnswer)
    private readonly answerRepository: Repository<ParticipantAnswer>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(ParticipantExamQuestion)
    private readonly peqRepository: Repository<ParticipantExamQuestion>,
    @InjectRepository(ExamRule)
    private readonly examRuleRepository: Repository<ExamRule>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly liveExamGateway: LiveExamGateway,
    private readonly authService: AuthService,
  ) {}

  async joinExam(joinExamDto: JoinExamDto) {
    // Validasi (tidak berubah)
    const examinee = await this.examineeRepository.findOneBy({
      id: joinExamDto.examinee_id,
    });
    if (!examinee)
      throw new NotFoundException('Peserta dengan ID tersebut tidak ditemukan');

    const exam = await this.examRepository.findOneBy({
      code: joinExamDto.code,
    });
    if (!exam)
      throw new NotFoundException('Ujian dengan kode tersebut tidak ditemukan');

    const now = new Date();
    if (exam.start_time && now < exam.start_time)
      throw new ForbiddenException('Ujian ini belum dimulai.');
    if (exam.end_time && now > exam.end_time)
      throw new ForbiddenException(
        'Waktu untuk bergabung ujian telah berakhir.',
      );

    // Cari sesi yang ada
    const existingParticipant = await this.participantRepository.findOne({
      where: { examinee: { id: examinee.id }, exam: { id: exam.id } },
      relations: ['examinee', 'exam'],
    });

    let participantForToken: Participant;

    if (existingParticipant) {
      if (existingParticipant.status === ParticipantStatus.FINISHED) {
        throw new ForbiddenException(
          'Anda sudah pernah menyelesaikan ujian ini.',
        );
      }
      console.log(`Peserta ${examinee.name} kembali ke lobi.`);
      participantForToken = existingParticipant; // Gunakan sesi yang ada, sudah lengkap dengan relasi
    } else {
      console.log(`Membuat sesi lobi baru untuk ${examinee.name}.`);
      const newParticipant = this.participantRepository.create({
        examinee: examinee,
        exam: exam,
      });
      const savedParticipant =
        await this.participantRepository.save(newParticipant);

      // --- PERBAIKAN DI SINI ---
      // Ambil ulang data dan simpan ke variabel sementara
      const reloadedParticipant = await this.participantRepository.findOne({
        where: { id: savedParticipant.id },
        relations: ['examinee', 'exam'],
      });

      // Tambahkan pengecekan untuk memastikan data ditemukan
      if (!reloadedParticipant) {
        throw new NotFoundException(
          'Gagal membuat atau mengambil sesi peserta baru setelah menyimpan.',
        );
      }

      // Jika berhasil, baru assign ke variabel utama
      participantForToken = reloadedParticipant;
      // --- AKHIR PERBAIKAN ---
    }

    const token = await this.authService.loginParticipant(participantForToken);

    return {
      participant: participantForToken,
      ...token,
    };
  }

  async beginExam(participantId: number) {
    // Ambil data participant LENGKAP dengan relasi exam dan examinee
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ['exam', 'examinee'], // <-- Pastikan relasi ini diambil
    });

    if (!participant) {
      throw new NotFoundException('Sesi pengerjaan tidak ditemukan.');
    }

    // Jika belum dimulai, set start_time dan SIARKAN PESERTA BARU
    if (participant.start_time === null) {
      console.log(
        `Peserta ID ${participantId} (${participant.examinee.name}) memulai ujian. Timer dimulai.`,
      );
      participant.start_time = new Date();
      const savedParticipant =
        await this.participantRepository.save(participant); // Simpan dulu

      // --- LOGIKA BARU UNTUK MENYIARKAN PESERTA BARU ---
      if (savedParticipant.exam && savedParticipant.examinee) {
        this.liveExamGateway.broadcastNewParticipant(
          savedParticipant.exam.id,
          savedParticipant.id,
          savedParticipant.examinee.name,
        );
      }
      // --- AKHIR LOGIKA BARU ---

      return savedParticipant;
    }

    console.log(
      `Peserta ID ${participantId} melanjutkan ujian yang sudah berjalan.`,
    );
    return participant;
  }

  async saveAnswer(data: SubmitAnswerPayload) {
    const participantExamQuestion = await this.peqRepository.findOneBy({
      id: data.examQuestionId,
    });
    if (!participantExamQuestion) return;

    const isCorrect =
      participantExamQuestion.question.correct_answer === data.answer;

    await this.answerRepository.upsert(
      {
        participant: { id: data.participantId },
        participant_exam_question: { id: data.examQuestionId },
        answer: data.answer,
        is_correct: isCorrect,
      },
      ['participant', 'participant_exam_question'],
    );

    console.log(
      `Jawaban untuk PEQ ID ${data.examQuestionId} disimpan. Status: ${isCorrect}`,
    );

    await this.recalculateAndBroadcastScore(data.participantId);
  }

  async finishExam(participantId: number) {
    const correctAnswers = await this.answerRepository.find({
      where: {
        participant: { id: participantId },
        is_correct: true,
      },
      relations: ['participant_exam_question'],
    });

    const totalScore = correctAnswers.reduce((sum, answer) => {
      return sum + (answer.participant_exam_question?.point || 0);
    }, 0);

    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ['exam'], // <-- Pastikan relasi 'exam' diambil
    });
    if (!participant)
      throw new NotFoundException('Sesi pengerjaan tidak ditemukan');

    participant.status = ParticipantStatus.FINISHED;
    participant.final_score = totalScore;
    const savedParticipant = await this.participantRepository.save(participant); // Simpan perubahan

    console.log(
      `Ujian untuk peserta ID ${participantId} selesai. Skor akhir: ${totalScore}`,
    );

    // --- LOGIKA BARU UNTUK MENYIARKAN STATUS ---
    if (savedParticipant.exam) {
      // Pastikan exam ada
      this.liveExamGateway.broadcastStatusUpdate(
        savedParticipant.exam.id,
        savedParticipant.id,
        ParticipantStatus.FINISHED, // Kirim status baru
      );
    }
    // --- AKHIR LOGIKA BARU ---

    return savedParticipant; // Kembalikan data yang sudah di-update
  }

  async getParticipantAnswers(participantId: number) {
    const answers = await this.answerRepository.find({
      where: { participant: { id: participantId } },
      relations: ['participant_exam_question'],
    });

    const formattedAnswers: Record<number, string> = {};
    answers.forEach((ans) => {
      if (ans.participant_exam_question) {
        formattedAnswers[ans.participant_exam_question.id] = ans.answer;
      }
    });
    return formattedAnswers;
  }

  async getExamQuestions(participantId: number) {
    // 1. Ambil data sesi peserta.
    //    Kita memuat relasi penting: 'examinee' (untuk nama), 'exam' (untuk detail ujian),
    //    dan 'generated_questions' (snapshot soal jika sudah ada).
    let participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: [
        'examinee', // Data peserta
        'exam', // Data ujian utama
        'generated_questions', // Snapshot soal yang sudah dibuat (jika ada)
        'generated_questions.question', // Detail soal di dalam snapshot
      ],
    });

    // Validasi dasar: pastikan sesi ada dan belum selesai.
    if (!participant) {
      throw new NotFoundException('Sesi pengerjaan tidak ditemukan');
    }
    if (participant.status === ParticipantStatus.FINISHED) {
      throw new ForbiddenException('Ujian ini telah selesai dikerjakan.');
    }

    // 2. Cek apakah 'snapshot' soal sudah pernah dibuat untuk peserta ini.
    if (
      !participant.generated_questions ||
      participant.generated_questions.length === 0
    ) {
      // 2.a. Jika belum ada snapshot, kita buat sekarang.
      console.log(`Membuat set soal baru untuk peserta ID ${participantId}`);

      // Inisialisasi daftar soal final dan daftar ID soal yang sudah terpakai.
      const finalQuestionSet: { question: Question; point: number }[] = [];
      const usedQuestionIds: number[] = [];

      // Ambil semua soal yang dipilih secara manual untuk ujian ini.
      const manualQuestions = await this.examQuestionRepository.find({
        where: { exam: { id: participant.exam.id } },
        relations: ['question'], // Muat detail soalnya.
      });

      // Tambahkan soal manual ke daftar final dan catat ID-nya.
      manualQuestions.forEach((mq) => {
        if (mq.question) {
          // Pastikan relasi question berhasil dimuat
          finalQuestionSet.push({ question: mq.question, point: mq.point });
          usedQuestionIds.push(mq.question.id);
        }
      });

      // Ambil semua aturan pembuatan soal acak untuk ujian ini.
      const randomRules = await this.examRuleRepository.find({
        where: { exam: { id: participant.exam.id } },
        relations: ['question_bank'], // Muat relasi bank soalnya.
      });

      // Iterasi melalui setiap aturan acak.
      for (const rule of randomRules) {
        // Ambil SEMUA ID soal dari bank soal yang sesuai dengan aturan ini,
        // KECUALI soal yang sudah dipakai (dari soal manual atau aturan sebelumnya).
        const eligibleQuestions = await this.questionRepository.find({
          select: ['id'], // Hanya perlu ID untuk diacak.
          where: {
            bank: { id: rule.question_bank.id }, // Filter berdasarkan bank soal.
            // Gunakan Not(In(...)) untuk eksklusi. Beri nilai [-1] jika usedQuestionIds kosong untuk mencegah error query.
            id: Not(In(usedQuestionIds.length > 0 ? usedQuestionIds : [-1])),
          },
        });

        // Ekstrak ID saja dari hasil query.
        let eligibleIds = eligibleQuestions.map((q) => q.id);

        // ACAK (SHUFFLE) daftar ID soal yang valid menggunakan algoritma Fisher-Yates.
        eligibleIds = shuffleArray(eligibleIds);

        // Ambil sejumlah ID soal yang dibutuhkan sesuai aturan, dari awal array yang sudah diacak.
        const selectedIds = eligibleIds.slice(0, rule.number_of_questions);

        // Jika ada ID yang terpilih, ambil data soal lengkapnya dari database.
        if (selectedIds.length > 0) {
          const randomQuestions = await this.questionRepository.find({
            where: { id: In(selectedIds) },
          });

          // Tambahkan soal acak yang terpilih ke daftar final dan catat ID-nya.
          randomQuestions.forEach((rq) => {
            finalQuestionSet.push({
              question: rq,
              point: rule.point_per_question,
            });
            usedQuestionIds.push(rq.id);
          });
        }
      }

      // (Opsional) Acak urutan gabungan soal manual dan acak untuk variasi tampilan.
      finalQuestionSet.sort(() => Math.random() - 0.5);

      // Siapkan data 'snapshot' untuk disimpan ke tabel 'participant_exam_questions'.
      const participantExamQuestionsToSave = finalQuestionSet.map((item) =>
        this.peqRepository.create({
          participant: { id: participant!.id }, // Use non-null assertion since we already validated
          question: { id: item.question.id }, // Hubungkan ke soal
          point: item.point, // Simpan poinnya
        }),
      );

      // Simpan semua 'snapshot' soal ke database.
      await this.peqRepository.save(participantExamQuestionsToSave);

      // --- PENGGANTI REKURSI ---
      // Muat ulang data participant SECARA EKSPLISIT setelah menyimpan snapshot
      // Ini memastikan kita mendapatkan data terbaru termasuk relasi 'generated_questions'.
      const updatedParticipant = await this.participantRepository.findOne({
        where: { id: participantId },
        relations: [
          'examinee',
          'exam',
          'generated_questions',
          'generated_questions.question', // Pastikan detail soal ikut dimuat
        ],
      });

      if (!updatedParticipant) {
        throw new NotFoundException(
          'Sesi pengerjaan tidak ditemukan setelah membuat soal.',
        );
      }

      // Timpa variabel participant lama dengan data baru yang sudah lengkap.
      participant = updatedParticipant;
    } else {
      // 2.b. Jika snapshot soal sudah ada, cukup tampilkan log.
      console.log(
        `Mengambil set soal yang sudah ada untuk peserta ID ${participantId}`,
      );
    }

    // 3. Hitung sisa waktu pengerjaan.
    let timeLeftSeconds: number;
    if (participant.start_time === null) {
      // Jika ujian belum dimulai (masih di lobi), kembalikan durasi penuh.
      timeLeftSeconds = participant.exam.duration_minutes * 60;
    } else {
      // Jika ujian sudah dimulai, hitung sisa waktu berdasarkan waktu mulai sesi,
      // durasi ujian, dan jadwal akhir ujian (mana yang lebih dulu).
      const now = Date.now();
      const sessionStartTime = new Date(participant.start_time).getTime();
      const sessionDurationInMs = participant.exam.duration_minutes * 60 * 1000;
      const sessionEndTime = sessionStartTime + sessionDurationInMs;
      // Jika tidak ada jadwal akhir, anggap tak terbatas.
      const scheduledEndTime = participant.exam.end_time
        ? new Date(participant.exam.end_time).getTime()
        : Infinity;
      // Waktu berakhir aktual adalah yang paling cepat antara akhir sesi atau akhir jadwal.
      const actualEndTime = Math.min(sessionEndTime, scheduledEndTime);
      // Hitung selisih waktu, minimal 0 detik.
      timeLeftSeconds = Math.max(0, Math.floor((actualEndTime - now) / 1000));
    }

    // 4. Sanitasi data soal: Hapus kunci jawaban sebelum dikirim ke frontend.
    //    Kita lakukan ini pada 'generated_questions' yang sudah pasti ada.
    participant.generated_questions.forEach((peq) => {
      if (peq.question) {
        // Lakukan pengecekan null untuk keamanan
        // Destructuring untuk mengambil semua properti KECUALI 'correct_answer'.
        const { correct_answer, ...questionDetails } = peq.question;
        // Timpa objek question di dalam snapshot dengan versi yang sudah disanitasi.
        peq.question = questionDetails as any; // 'as any' digunakan karena TypeScript tidak suka penghapusan properti.
      }
    });

    // 5. Format respons agar sesuai dengan ekspektasi frontend.
    //    Frontend mengharapkan properti 'exam_questions', bukan 'generated_questions'.
    const response = {
      ...participant, // Salin semua properti participant (id, examinee, exam, status, dll.)
      exam: {
        ...participant.exam, // Salin semua properti exam (title, duration, dll.)
        exam_questions: participant.generated_questions, // Ganti nama properti soal
      },
      time_left_seconds: timeLeftSeconds, // Sertakan sisa waktu
    };
    // Hapus properti 'generated_questions' yang asli dari level atas objek respons.
    delete (response as any).generated_questions;

    // Kembalikan objek respons yang sudah diformat.
    return response;
  }

  private async recalculateAndBroadcastScore(participantId: number) {
    const correctAnswers = await this.answerRepository.find({
      where: {
        participant: { id: participantId },
        is_correct: true,
      },
      relations: ['participant_exam_question'],
    });

    const currentScore = correctAnswers.reduce((sum, answer) => {
      return sum + (answer.participant_exam_question?.point || 0);
    }, 0);

    // --- INILAH PERBAIKAN UTAMANYA ---
    // Ambil ID ujian dengan memuat relasi 'exam'
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ['exam'], // <-- PASTIKAN RELASI INI DIAMBIL
    });

    if (participant && participant.exam) {
      const examId = participant.exam.id;
      this.liveExamGateway.broadcastScoreUpdate(
        examId,
        participantId,
        currentScore,
      );
    }
  }
}
