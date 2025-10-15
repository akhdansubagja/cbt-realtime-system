// src/participants/participants.module.ts

import { Module } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { KafkaController } from './kafka.controller';
import { ExamQuestion } from 'src/exams/entities/exam-question.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Participant,
      Examinee,
      Exam,
      ParticipantAnswer,
      ExamQuestion, // Pastikan ini ada
    ]),
  ],
  controllers: [ParticipantsController, KafkaController],
  providers: [ParticipantsService],
})
export class ParticipantsModule {}