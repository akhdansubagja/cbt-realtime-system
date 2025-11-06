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
   * Mengambil semua peserta dalam satu batch,
   * diurutkan berdasarkan total skor,
   * dan menghitung jumlah ujian yang telah selesai.
   */
  async getBatchParticipantReport(batchId: number) {
    return (
      this.examineeRepository
        .createQueryBuilder('examinee')

        // 1. Ambil data 'participant' terkait
        //    TAPI filter 'finished' di dalam 'ON' clause
        .leftJoin(
          'examinee.participants',
          'participant',
          'participant.status = :status', // <-- Pindahkan filter ke sini
          { status: 'finished' },
        )

        // 2. Sekarang, 'WHERE' HANYA memfilter peserta berdasarkan batch
        .where('examinee.batch_id = :batchId', { batchId })

        // 3. Hitung jumlah ujian (akan jadi '0' jika tidak ada join)
        .addSelect('COUNT(participant.id)', 'examCount')

        // 4. Hitung total skor (gunakan COALESCE untuk mengubah NULL jadi 0)
        .addSelect('COALESCE(SUM(participant.final_score), 0)', 'totalScore')

        // 5. Kelompokkan berdasarkan ID peserta
        .groupBy('examinee.id')

        // 6. Urutkan berdasarkan total skor (DESC)
        .orderBy('"totalScore"', 'DESC') // Aman menggunakan alias di sini

        // 7. Ambil data mentahnya
        .getRawMany()
    );
  }

  /**
   * Endpoint B (Grafik):
   * Menghitung nilai rata-rata batch untuk setiap ujian yang diambil.
   */
  async getBatchAverageReport(batchId: number) {
    return (
      this.participantRepository
        .createQueryBuilder('participant')
        .innerJoin('participant.examinee', 'examinee')
        .innerJoin('participant.exam', 'exam')
        .where('examinee.batch_id = :batchId', { batchId })
        .andWhere('participant.status = :status', { status: 'finished' })

        // V V V PERBAIKAN DI SINI V V V
        // Kita gunakan .select() untuk MENGGANTI pilihan kolom default,
        // bukan .addSelect() (yang MENAMBAH).
        .select('exam.title', 'examTitle')
        .addSelect('ROUND(AVG(participant.final_score), 2)', 'averageScore')
        // ^ ^ ^ BATAS PERBAIKAN ^ ^ ^

        .groupBy('exam.id') // Kita masih perlu group by ID untuk akurasi
        .addGroupBy('exam.title')
        .orderBy('exam.title', 'ASC')
        .getRawMany()
    );
  }
}
