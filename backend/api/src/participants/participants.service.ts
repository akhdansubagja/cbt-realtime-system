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
import { Repository } from 'typeorm';
import { JoinExamDto } from './dto/join-exam.dto';
import { Participant, ParticipantStatus } from './entities/participant.entity';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { ExamQuestion } from 'src/exams/entities/exam-question.entity';
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
  ) {}

  async joinExam(joinExamDto: JoinExamDto) {
    // Validasi examinee dan exam (tetap sama)
    const examinee = await this.examineeRepository.findOneBy({ id: joinExamDto.examinee_id });
    if (!examinee) throw new NotFoundException('Peserta tidak ditemukan');

    const exam = await this.examRepository.findOneBy({ code: joinExamDto.code });
    if (!exam) throw new NotFoundException('Ujian tidak ditemukan');
    
    // Validasi jadwal (tetap sama)
    const now = new Date();
    if (exam.start_time && now < exam.start_time) throw new ForbiddenException('Ujian ini belum dimulai.');
    if (exam.end_time && now > exam.end_time) throw new ForbiddenException('Waktu untuk bergabung ujian telah berakhir.');

    // Cari sesi yang ada
    const existingParticipant = await this.participantRepository.findOne({
      where: { examinee: { id: examinee.id }, exam: { id: exam.id } },
      relations: ['examinee', 'exam'],
    });

    if (existingParticipant) {
      if (existingParticipant.status === ParticipantStatus.FINISHED) {
        throw new ForbiddenException('Anda sudah pernah menyelesaikan ujian ini.');
      }
      console.log(`Peserta ${examinee.name} kembali ke lobi.`);
      return existingParticipant; // Langsung kembalikan, jangan reset timer
    }

    // Jika tidak ada sesi, buat yang baru TANPA start_time
    console.log(`Membuat sesi lobi baru untuk ${examinee.name}.`);
    const newParticipant = this.participantRepository.create({
      examinee: examinee,
      exam: exam,
      // start_time sengaja dibiarkan null
    });

    return this.participantRepository.save(newParticipant);
  }

  async beginExam(participantId: number) {
    const participant = await this.participantRepository.findOneBy({ id: participantId });
    if (!participant) {
      throw new NotFoundException('Sesi pengerjaan tidak ditemukan.');
    }

    // PENTING: Hanya set start_time jika belum pernah di-set sebelumnya
    if (participant.start_time === null) {
      console.log(`Peserta ID ${participantId} memulai ujian. Timer dimulai.`);
      participant.start_time = new Date();
      return this.participantRepository.save(participant);
    }

    console.log(`Peserta ID ${participantId} melanjutkan ujian yang sudah berjalan.`);
    return participant; // Jika sudah ada, kembalikan saja tanpa mengubah apa pun
  }

  async saveAnswer(data: SubmitAnswerPayload) {
    console.log('Service dipanggil untuk menyimpan jawaban:', data);

    // 1. Ambil data soal ujian, termasuk kunci jawabannya
    const examQuestion = await this.examQuestionRepository.findOne({
      where: { id: data.examQuestionId },
      relations: ['question'], // Ambil relasi ke tabel 'questions' yang berisi kunci jawaban
    });

    if (!examQuestion) {
      console.error(
        `ExamQuestion dengan ID ${data.examQuestionId} tidak ditemukan.`,
      );
      return;
    }

    // 2. Bandingkan jawaban
    const isCorrect = examQuestion.question.correct_answer === data.answer;
    console.log(
      `Jawaban peserta: ${data.answer}, Kunci Jawaban: ${examQuestion.question.correct_answer}. Hasil: ${isCorrect}`,
    );

    // 3. Cari apakah jawaban sebelumnya sudah ada
    const existingAnswer = await this.answerRepository.findOneBy({
      participant: { id: data.participantId },
      exam_question: { id: data.examQuestionId },
    });

    if (existingAnswer) {
      // Jika ada, update jawaban dan status kebenarannya
      existingAnswer.answer = data.answer;
      existingAnswer.is_correct = isCorrect; // <-- Update status
      await this.answerRepository.save(existingAnswer);
      console.log(
        `Jawaban untuk soal ${data.examQuestionId} telah di-update. Status: ${isCorrect}`,
      );
    } else {
      // Jika tidak ada, buat jawaban baru
      const newAnswer = this.answerRepository.create({
        participant: { id: data.participantId },
        exam_question: { id: data.examQuestionId },
        answer: data.answer,
        is_correct: isCorrect, // <-- Simpan status
      });
      await this.answerRepository.save(newAnswer);
      console.log(
        `Jawaban baru untuk soal ${data.examQuestionId} telah disimpan. Status: ${isCorrect}`,
      );
    }
  }

  async finishExam(participantId: number) {
    // 1. Ambil semua jawaban yang benar dari peserta ini
    const correctAnswers = await this.answerRepository.find({
      where: {
        participant: { id: participantId },
        is_correct: true, // Hanya ambil jawaban yang benar
      },
      relations: ['exam_question'], // Kita butuh relasi ini untuk mendapatkan poin
    });

    // 2. Hitung total skor
    const totalScore = correctAnswers.reduce((sum, answer) => {
      // Pastikan exam_question tidak null sebelum mengakses point
      return sum + (answer.exam_question?.point || 0);
    }, 0);

    // 3. Ambil data peserta untuk di-update
    const participant = await this.participantRepository.findOneBy({
      id: participantId,
    });
    if (!participant) {
      throw new NotFoundException('Sesi pengerjaan tidak ditemukan');
    }

    // 4. Update status dan skor akhir, lalu simpan
    participant.status = ParticipantStatus.FINISHED;
    participant.final_score = totalScore;

    await this.participantRepository.save(participant);

    console.log(
      `Ujian untuk peserta ID ${participantId} selesai. Skor akhir: ${totalScore}`,
    );

    // 5. Kembalikan data yang sudah di-update
    return participant;
  }

  async getParticipantAnswers(participantId: number) {
    const answers = await this.answerRepository.find({
      where: { participant: { id: participantId } },
      select: ['exam_question', 'answer'], // Hanya pilih kolom yang dibutuhkan
      relations: ['exam_question'],
    });
  
    // Ubah format agar mudah digunakan di frontend
    const formattedAnswers: Record<number, string> = {};
    answers.forEach(ans => {
      if (ans.exam_question) {
        formattedAnswers[ans.exam_question.id] = ans.answer;
      }
    });
    return formattedAnswers;
  }

  async getExamQuestions(participantId: number) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ['examinee', 'exam', 'exam.exam_questions', 'exam.exam_questions.question'],
    });

    if (!participant) throw new NotFoundException('Sesi pengerjaan tidak ditemukan');
    if (participant.status === ParticipantStatus.FINISHED) throw new ForbiddenException('Ujian ini telah selesai.');

    let timeLeftSeconds: number;

    if (participant.start_time === null) {
      // Jika ujian belum dimulai (masih di lobi), kembalikan durasi penuh
      timeLeftSeconds = participant.exam.duration_minutes * 60;
    } else {
      // Jika ujian sudah berjalan, hitung sisa waktunya
      const now = Date.now();
      const sessionStartTime = new Date(participant.start_time).getTime();
      const sessionDurationInMs = participant.exam.duration_minutes * 60 * 1000;
      const sessionEndTime = sessionStartTime + sessionDurationInMs;
      const scheduledEndTime = participant.exam.end_time ? new Date(participant.exam.end_time).getTime() : Infinity;
      const actualEndTime = Math.min(sessionEndTime, scheduledEndTime);
      timeLeftSeconds = Math.max(0, Math.floor((actualEndTime - now) / 1000));
    }

    // Sanitasi kunci jawaban
    participant.exam.exam_questions.forEach((eq) => {
      const { correct_answer, ...questionDetails } = eq.question;
      eq.question = questionDetails as any;
    });

    return { ...participant, time_left_seconds: timeLeftSeconds };
  }
}
