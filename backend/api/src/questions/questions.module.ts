// src/questions/questions.module.ts

import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question])], // <-- Daftarkan di sini
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}