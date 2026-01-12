import { Module, forwardRef } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { ParticipantAnswer } from './entities/participant-answer.entity';

import { ExamQuestion } from 'src/exams/entities/exam-question.entity';
import { ParticipantExamQuestion } from './entities/participant-exam-question.entity'; // <-- Import entity baru
import { ExamRule } from 'src/exams/entities/exam-rule.entity'; // <-- Import entity aturan
import { Question } from 'src/questions/entities/question.entity'; // <-- Import entity soal
import { LiveExamModule } from 'src/live-exam/live-exam.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Participant,
      Examinee,
      Exam,
      ParticipantAnswer,
      ExamQuestion,
      ParticipantExamQuestion, // Daftarkan repo baru
      ExamRule, // Daftarkan repo aturan
      Question, // Daftarkan repo soal
      AuthModule,
    ]),
    forwardRef(() => LiveExamModule),
    AuthModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
