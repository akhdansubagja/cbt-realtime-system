// src/examinees/examinees.module.ts

import { Module } from '@nestjs/common';
import { ExamineesService } from './examinees.service';
import { ExamineesController } from './examinees.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Examinee } from './entities/examinee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Examinee])], // <-- Pastikan ini ada
  controllers: [ExamineesController],
  providers: [ExamineesService],
})
export class ExamineesModule {}