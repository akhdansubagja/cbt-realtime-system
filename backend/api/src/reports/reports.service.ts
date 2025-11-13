// backend/api/src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Repository } from 'typeorm';
import { Participant } from 'src/participants/entities/participant.entity';
import * as ExcelJS from 'exceljs';

const createAcronym = (title: string) => {
  const words = title.split(' ').filter((w) => w.length > 0); // Bersihkan spasi ganda

  if (words.length === 0) return '?';

  if (words.length === 1) {
    // "Informatika" -> "IN"
    return words[0].substring(0, 2).toUpperCase();
  }

  // "Ujian Akhir Semester" -> "UA"
  const firstLetter = words[0][0];
  const secondLetter = words[1][0];
  return `${firstLetter}${secondLetter}`.toUpperCase();
};

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
    const examineesWithAggregates = await this.examineeRepository
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
    const rawUniqueExams = await this.getBatchUniqueExams(batchId);

    // Buat versi 'shortTitle' dari title
    const uniqueExams = rawUniqueExams.map((exam) => ({
      ...exam,
      shortTitle: createAcronym(exam.title), // <-- Gunakan helper baru
    }));
    const allScoresRaw = await this.participantRepository
      .createQueryBuilder('participant')
      .innerJoin('participant.examinee', 'examinee')
      .where('examinee.batch_id = :batchId', { batchId })
      .andWhere('participant.status = :status', { status: 'finished' })
      .select([
        'participant.examinee_id AS "examineeId"',
        'participant.exam_id AS "examId"',
        'participant.final_score AS "score"',
      ])
      .getRawMany();
    const scoresMap = new Map<number, Map<number, number>>();
    for (const score of allScoresRaw) {
      // Dapatkan peta untuk peserta ini
      let examineeMap = scoresMap.get(score.examineeId);

      // Jika peta-nya belum ada, buat baru dan set ke map utama
      if (!examineeMap) {
        examineeMap = new Map<number, number>();
        scoresMap.set(score.examineeId, examineeMap);
      }

      // Sekarang 'examineeMap' dijamin terdefinisi, kita bisa set skornya
      examineeMap.set(score.examId, score.score);
    }

    // 5. Gabungkan data agregat dengan data skor individu
    const participantScores = examineesWithAggregates.map((examinee) => {
      // getRawMany() akan mengembalikan nama kolom sbg 'examinee_id', 'examinee_name', dll.
      const examineeId = examinee.examinee_id;
      const examineeScores = scoresMap.get(examineeId) || new Map();

      // Buat array skor individu sesuai urutan uniqueExams
      const scores = uniqueExams.map((exam) => ({
        examId: exam.id, // exam.id berasal dari getBatchUniqueExams
        score: examineeScores.get(exam.id) || null, // null jika peserta tidak ambil ujian tsb
      }));

      // getRawMany() mengembalikan string, kita perlu parseInt
      const examCount = parseInt(examinee.examCount, 10);
      const totalScore = parseInt(examinee.totalScore, 10);

      return {
        examinee: {
          id: examineeId,
          name: examinee.examinee_name,
          avatar: examinee.examinee_avatar_url,
        },
        examCount: examCount,
        totalScore: totalScore,
        averageScore:
          examCount > 0 ? parseFloat((totalScore / examCount).toFixed(2)) : 0,
        scores: scores, // <-- Ini array baru yang berisi skor individu
      };
    });

    return {
      uniqueExams,
      participantScores,
    };
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
    return (
      this.participantRepository
        .createQueryBuilder('participant')
        .innerJoin('participant.examinee', 'examinee')
        .innerJoin('participant.exam', 'exam')
        .where('examinee.batch_id = :batchId', { batchId })
        .andWhere('participant.status = :status', { status: 'finished' })
        .select(['exam.id AS id', 'exam.title AS title'])
        .groupBy('exam.id, exam.title')
        // PERBAIKAN: Mengurutkan berdasarkan 'exam.title', bukan 'examinee.name'
        .orderBy('exam.title', 'ASC')
        .getRawMany()
    );
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

  /**
   * Endpoint C (Export):
   * Membuat file Excel (.xlsx) dari data batch
   */
  async exportBatchReport(batchId: number): Promise<Buffer> {
    // 1. Dapatkan data (kita gunakan ulang fungsi yang ada)
    const reportData = await this.getBatchParticipantReport(batchId);
    const averageData = await this.getBatchAverageReport(batchId);

    // 2. Buat Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem CBT Realtime';
    workbook.created = new Date();

    // --- SHEET 1: Rangkuman Nilai Peserta (Tabel Lebar) ---
    const sheet1 = workbook.addWorksheet('Rangkuman Nilai Peserta');

    // Buat Header Dinamis untuk Sheet 1
    const headersSheet1: Partial<ExcelJS.Column>[] = [
      { header: 'Nama Peserta', key: 'name', width: 30 },
    ];

    // Tambahkan kolom untuk setiap ujian
    reportData.uniqueExams.forEach((exam) => {
      headersSheet1.push({
        header: exam.title, // <-- PERUBAHAN DI SINI: Gunakan 'title'
        key: `exam_${exam.id}`,
        width: 30, // <-- Kita perlebar kolomnya agar muat
      });
    });

    // Tambahkan kolom agregat di akhir
    headersSheet1.push(
      { header: 'Jml. Ujian', key: 'examCount', width: 12 },
      { header: 'Total Skor', key: 'totalScore', width: 12 },
      { header: 'Rata-rata', key: 'averageScore', width: 12 },
    );

    sheet1.columns = headersSheet1;

    // Tambahkan data baris untuk Sheet 1
    reportData.participantScores.forEach((participant) => {
      // Siapkan data baris
      const rowData: any = {
        name: participant.examinee.name,
        examCount: participant.examCount,
        totalScore: participant.totalScore,
        averageScore: parseFloat(participant.averageScore.toFixed(2)),
      };

      // Masukkan nilai untuk setiap ujian
      participant.scores.forEach((score) => {
        rowData[`exam_${score.examId}`] =
          score.score !== null ? score.score : '-';
      });

      sheet1.addRow(rowData);
    });

    // Style Header Sheet 1 (Bold dan Latar Abu-abu)
    sheet1.getRow(1).font = { bold: true };
    sheet1.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }, // Abu-abu muda
    };

    // --- SHEET 2: Rangkuman Rata-rata Ujian (Data Grafik) ---
    const sheet2 = workbook.addWorksheet('Rangkuman Rata-rata Ujian');

    sheet2.columns = [
      { header: 'Nama Ujian', key: 'examTitle', width: 40 },
      { header: 'Nilai Rata-rata Batch', key: 'averageScore', width: 20 },
    ];

    // Tambahkan data baris untuk Sheet 2
    averageData.forEach((data) => {
      sheet2.addRow({
        examTitle: data.examTitle,
        averageScore: parseFloat(data.averageScore), // Pastikan ini angka
      });
    });

    // Style Header Sheet 2
    sheet2.getRow(1).font = { bold: true };
    sheet2.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // 4. Kembalikan sebagai Buffer
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
