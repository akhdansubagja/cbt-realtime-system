// src/participants/participants.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from 'src/exams/entities/exam.entity';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Repository } from 'typeorm';
import { JoinExamDto } from './dto/join-exam.dto';
import { Participant } from './entities/participant.entity';
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
    // 1. Validasi apakah examinee ada
    const examinee = await this.examineeRepository.findOneBy({
      id: joinExamDto.examinee_id,
    });
    if (!examinee) {
      throw new NotFoundException('Peserta dengan ID tersebut tidak ditemukan');
    }

    // 2. Validasi apakah ujian ada
    const exam = await this.examRepository.findOneBy({
      code: joinExamDto.code,
    });
    if (!exam) {
      throw new NotFoundException('Ujian dengan kode tersebut tidak ditemukan');
    }

    // 3. (PENTING) Cek apakah peserta sudah pernah join ujian ini
    const existingParticipant = await this.participantRepository.findOneBy({
      examinee: { id: examinee.id },
      exam: { id: exam.id },
    });
    if (existingParticipant) {
      throw new ConflictException('Anda sudah bergabung dengan ujian ini');
    }

    // 4. Jika semua valid, buat sesi baru
    const newParticipant = this.participantRepository.create({
      examinee: examinee,
      exam: exam,
    });

    return this.participantRepository.save(newParticipant);
  }

  async getExamQuestions(participantId: number) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: [
        'exam',
        'exam.exam_questions',
        'exam.exam_questions.question',
      ],
    });

    if (!participant) {
      throw new NotFoundException('Sesi pengerjaan tidak ditemukan');
    }

    // --- PERBAIKAN DIMULAI DI SINI ---

    // 1. Buat salinan soal yang sudah disanitasi (tanpa kunci jawaban)
    const sanitizedExamQuestions = participant.exam.exam_questions.map((eq) => {
      // Ambil semua properti dari 'question' KECUALI 'correct_answer'
      const { correct_answer, ...questionDetails } = eq.question;
      
      // Kembalikan objek exam_question yang utuh, tapi dengan detail soal yang sudah bersih
      return {
        ...eq,
        question: questionDetails,
      };
    });

    // 2. Kembalikan seluruh objek participant dengan daftar soal yang sudah bersih
    return {
      ...participant,
      exam: {
        ...participant.exam,
        exam_questions: sanitizedExamQuestions,
      },
    };

    // --- PERBAIKAN SELESAI ---
  }


  async saveAnswer(data: SubmitAnswerPayload) {
    console.log('Service dipanggil untuk menyimpan jawaban:', data);

    // 1. Ambil data soal ujian, termasuk kunci jawabannya
    const examQuestion = await this.examQuestionRepository.findOne({
      where: { id: data.examQuestionId },
      relations: ['question'], // Ambil relasi ke tabel 'questions' yang berisi kunci jawaban
    });

    if (!examQuestion) {
      console.error(`ExamQuestion dengan ID ${data.examQuestionId} tidak ditemukan.`);
      return;
    }

    // 2. Bandingkan jawaban
    const isCorrect = examQuestion.question.correct_answer === data.answer;
    console.log(`Jawaban peserta: ${data.answer}, Kunci Jawaban: ${examQuestion.question.correct_answer}. Hasil: ${isCorrect}`);

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
      console.log(`Jawaban untuk soal ${data.examQuestionId} telah di-update. Status: ${isCorrect}`);
    } else {
      // Jika tidak ada, buat jawaban baru
      const newAnswer = this.answerRepository.create({
        participant: { id: data.participantId },
        exam_question: { id: data.examQuestionId },
        answer: data.answer,
        is_correct: isCorrect, // <-- Simpan status
      });
      await this.answerRepository.save(newAnswer);
      console.log(`Jawaban baru untuk soal ${data.examQuestionId} telah disimpan. Status: ${isCorrect}`);
    }
  }
}