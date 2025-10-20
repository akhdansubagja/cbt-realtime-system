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

  async create(createExamDto: CreateExamDto) {
    // 1. Buat dan simpan data ujian utama (tidak berubah)
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

  async update(id: number, updateExamDto: UpdateExamDto) {
    // 1. Update data utama ujian
    await this.examRepository.update(id, {
      title: updateExamDto.title,
      code: updateExamDto.code,
      duration_minutes: updateExamDto.duration_minutes,
      start_time: updateExamDto.start_time,
      end_time: updateExamDto.end_time,
    });

    // 2. Hapus semua soal manual dan aturan acak yang lama
    await this.examQuestionRepository.delete({ exam: { id } });
    await this.examRuleRepository.delete({ exam: { id } });

    const exam = { id }; // Objek referensi

    // 3. Masukkan kembali soal manual yang baru (jika ada)
    if (
      updateExamDto.manual_questions &&
      updateExamDto.manual_questions.length > 0
    ) {
      const manualQuestions = updateExamDto.manual_questions.map((q) =>
        this.examQuestionRepository.create({
          exam,
          question: { id: q.question_id },
          point: q.point,
        }),
      );
      await this.examQuestionRepository.save(manualQuestions);
    }

    // 4. Masukkan kembali aturan acak yang baru (jika ada)
    if (updateExamDto.random_rules && updateExamDto.random_rules.length > 0) {
      const randomRules = updateExamDto.random_rules.map((r) =>
        this.examRuleRepository.create({
          exam,
          question_bank: { id: r.question_bank_id },
          ...r,
        }),
      );
      await this.examRuleRepository.save(randomRules);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    // Dengan onDelete: 'CASCADE', menghapus exam akan otomatis menghapus semua relasinya
    const result = await this.examRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ujian dengan ID ${id} tidak ditemukan`);
    }
    return result;
  }

  findAll() {
    return this.examRepository.find({ order: { id: 'DESC' } });
  }

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

  async getParticipantsForExam(examId: number) {
    // 1. Ambil semua peserta untuk ujian ini
    const participants = await this.participantRepository.find({
      where: { exam: { id: examId } },
      relations: ['examinee'],
    });

    // 2. Untuk setiap peserta, hitung skor sementaranya
    const participantsWithScores = await Promise.all(
      participants.map(async (p) => {
        // Jika sudah selesai, gunakan skor final
        if (p.final_score !== null) {
          return { ...p, current_score: p.final_score };
        }
        
        // Jika belum, hitung dari awal
        const correctAnswers = await this.answerRepository.find({
          where: { participant: { id: p.id }, is_correct: true },
          relations: ['participant_exam_question'],
        });
        
        const currentScore = correctAnswers.reduce((sum, answer) => {
          return sum + (answer.participant_exam_question?.point || 0);
        }, 0);
        
        return { ...p, current_score: currentScore };
      }),
    );
    
    return participantsWithScores;
  }
}
