// src/exams/exams.module.ts

import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { ExamRule } from './entities/exam-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamQuestion, ExamRule])], // <-- Daftarkan keduanya
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}