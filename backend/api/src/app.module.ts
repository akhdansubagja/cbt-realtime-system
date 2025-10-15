// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import semua Entity
import { User } from './users/entities/user.entity';
import { QuestionBank } from './question-banks/entities/question-bank.entity';
import { Question } from './questions/entities/question.entity';
import { Exam } from './exams/entities/exam.entity';
import { ExamQuestion } from './exams/entities/exam-question.entity';
import { Examinee } from './examinees/entities/examinee.entity';
import { Participant } from './participants/entities/participant.entity';
import { ParticipantAnswer } from './participants/entities/participant-answer.entity'; // <-- Import yang hilang

// Import semua Module
import { UsersModule } from './users/users.module';
import { QuestionBanksModule } from './question-banks/question-banks.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';
import { ExamineesModule } from './examinees/examinees.module';
import { ParticipantsModule } from './participants/participants.module';
import { LiveExamModule } from './live-exam/live-exam.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // V V V BAGIAN YANG DIPERBAIKI V V V
      entities: [
        User,
        QuestionBank,
        Question,
        Exam,
        ExamQuestion,
        Examinee,
        Participant,
        ParticipantAnswer, // <-- Ditambahkan di sini
      ],
      // ^ ^ ^ SEKARANG SUDAH LENGKAP DAN BENAR ^ ^ ^
      synchronize: true,
    }),
    UsersModule,
    QuestionBanksModule,
    QuestionsModule,
    ExamsModule,
    ExamineesModule,
    ParticipantsModule,
    LiveExamModule,
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}