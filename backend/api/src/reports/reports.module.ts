import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Participant } from 'src/participants/entities/participant.entity';
import { Exam } from 'src/exams/entities/exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Examinee, Participant, Exam])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
