// src/examinees/examinees.module.ts

import { Module } from '@nestjs/common';
import { ExamineesService } from './examinees.service';
import { ExamineesController } from './examinees.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Examinee } from './entities/examinee.entity';
import { Batch } from 'src/batches/entities/batch.entity';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([Examinee, Batch]),
    MulterModule.register({
      dest: './uploads', // Kita gunakan folder 'uploads' yang sudah ada
    }),
  ],
  controllers: [ExamineesController],
  providers: [ExamineesService],
  exports: [ExamineesService],
})
export class ExamineesModule {}
