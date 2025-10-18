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
import { ParticipantExamQuestion } from './entities/participant-exam-question.entity'; // <-- Import entity baru
import { ExamRule } from 'src/exams/entities/exam-rule.entity'; // <-- Import entity aturan
import { Question } from 'src/questions/entities/question.entity'; // <-- Import entity soal

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Participant,
      Examinee,
      Exam,
      ParticipantAnswer,
      ExamQuestion,
      ParticipantExamQuestion, // Daftarkan repo baru
      ExamRule,                // Daftarkan repo aturan
      Question,                // Daftarkan repo soal
    ]),
  ],
  controllers: [ParticipantsController, KafkaController],
  providers: [ParticipantsService],
})
export class ParticipantsModule {}