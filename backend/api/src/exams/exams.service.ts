// src/exams/exams.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
@Injectable()
export class ExamsService {


  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
  ) {}

  async create(createExamDto: CreateExamDto) {
    // 1. Buat dan simpan data ujian utama
    const newExam = this.examRepository.create({
      title: createExamDto.title,
      code: createExamDto.code,
      duration_minutes: createExamDto.duration_minutes,
    });
    const savedExam = await this.examRepository.save(newExam);

    // 2. Siapkan data soal untuk ujian ini
    const examQuestions = createExamDto.questions.map((q) => {
      return this.examQuestionRepository.create({
        exam: savedExam, // Hubungkan dengan ujian yang baru disimpan
        question: { id: q.question_id }, // Hubungkan dengan soal yang sudah ada
        point: q.point,
      });
    });

    // 3. Simpan semua data soal-ujian ke tabel pivot
    await this.examQuestionRepository.save(examQuestions);

    return savedExam;
  }
 
   findAll() {
    // GANTI BAGIAN INI
    return this.examRepository.find({
      relations: ['exam_questions', 'exam_questions.question'], // Ambil juga relasinya
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} exam`;
  }

  update(id: number, updateExamDto: UpdateExamDto) {
    return `This action updates a #${id} exam`;
  }

  remove(id: number) {
    return `This action removes a #${id} exam`;
  }
}
