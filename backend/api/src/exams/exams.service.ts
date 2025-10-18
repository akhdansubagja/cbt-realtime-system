// src/exams/exams.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { ExamRule } from './entities/exam-rule.entity';
@Injectable()
export class ExamsService {


  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(ExamRule)
    private readonly examRuleRepository: Repository<ExamRule>,
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
    if (createExamDto.manual_questions && createExamDto.manual_questions.length > 0) {
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
