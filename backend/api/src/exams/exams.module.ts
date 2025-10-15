// src/exams/exams.module.ts

import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamQuestion])], // <-- Daftarkan keduanya
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}