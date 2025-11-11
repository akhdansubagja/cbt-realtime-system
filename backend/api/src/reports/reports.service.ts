// backend/api/src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Repository } from 'typeorm';
import { Participant } from 'src/participants/entities/participant.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Examinee)
    private readonly examineeRepository: Repository<Examinee>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) {}

  /**
   * Endpoint A (Tabel):
   * Diurutkan berdasarkan NAMA, dan sekarang juga MENGAMBIL avatar_url
   */
  async getBatchParticipantReport(batchId: number) {
    return this.examineeRepository
      .createQueryBuilder('examinee')
      .leftJoin(
        'examinee.participants',
        'participant',
        'participant.status = :status',
        { status: 'finished' },
      )
      .where('examinee.batch_id = :batchId', { batchId })
      .addSelect('examinee.avatar_url', 'examinee_avatar_url')
      .addSelect('COUNT(participant.id)', 'examCount')
      .addSelect('COALESCE(SUM(participant.final_score), 0)', 'totalScore')
      .groupBy('examinee.id, examinee.avatar_url')
      .orderBy('examinee.name', 'ASC') // <-- PERBAIKAN: Urut abjad
      .getRawMany();
  }

  /**
   * Endpoint B (Grafik):
   * Menghitung nilai rata-rata batch untuk setiap ujian yang diambil.
   */
  async getBatchAverageReport(batchId: number) {
    return this.participantRepository
      .createQueryBuilder('participant')
      .innerJoin('participant.examinee', 'examinee')
      .innerJoin('participant.exam', 'exam')
      .where('examinee.batch_id = :batchId', { batchId })
      .andWhere('participant.status = :status', { status: 'finished' })
      .select('exam.title', 'examTitle')
      .addSelect('ROUND(AVG(participant.final_score), 2)', 'averageScore')
      .groupBy('exam.id')
      .addGroupBy('exam.title')
      .orderBy('exam.title', 'ASC')
      .getRawMany();
  }

  /**
   * Endpoint A (Dropdown):
   * Memperbaiki error SQL 'examinee.name'
   */
  async getBatchUniqueExams(batchId: number) {
    return this.participantRepository
      .createQueryBuilder('participant')
      .innerJoin('participant.examinee', 'examinee')
      .innerJoin('participant.exam', 'exam')
      .where('examinee.batch_id = :batchId', { batchId })
      .andWhere('participant.status = :status', { status: 'finished' })
      .select(['exam.id AS id', 'exam.title AS title'])
      .groupBy('exam.id, exam.title')
      // PERBAIKAN: Mengurutkan berdasarkan 'exam.title', bukan 'examinee.name'
      .orderBy('exam.title', 'ASC') 
      .getRawMany();
  }

  /**
   * Endpoint B (Grafik Drill-down):
   * Sekarang juga MENGAMBIL avatar_url
   */
  async getBatchExamPerformance(batchId: number, examId: number) {
    return this.examineeRepository
      .createQueryBuilder('examinee')
      .leftJoin(
        'examinee.participants',
        'participant',
        'participant.exam_id = :examId AND participant.status = :status',
        { examId, status: 'finished' },
      )
      .where('examinee.batch_id = :batchId', { batchId })
      .select([
        'examinee.name AS name',
        'COALESCE(participant.final_score, 0) AS score',
        'examinee.avatar_url AS avatar_url', // <-- PERBAIKAN: Tambah avatar
      ])
      .groupBy('examinee.id, participant.final_score, examinee.avatar_url')
      .orderBy('examinee.name', 'ASC') // <-- PERBAIKAN: Urut abjad
      .getRawMany();
  }
}