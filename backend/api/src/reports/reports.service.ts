// backend/api/src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Repository } from 'typeorm';
import {
  Participant,
  ParticipantStatus,
} from 'src/participants/entities/participant.entity';
import { ParticipantExamQuestion } from 'src/participants/entities/participant-exam-question.entity';
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
    // --- ADDED: Repository for calculating max scores ---
    @InjectRepository(ParticipantExamQuestion)
    private readonly peqRepository: Repository<ParticipantExamQuestion>,
  ) {}

  /**
   * Membuat Laporan Tabel Partisipan Batch.
   * Mengumpulkan semua nilai ujian dari setiap peserta dalam batch.
   * Menghitung nilai mentah, nilai maksimal, rata-rata, dan total.
   *
   * @param batchId ID Batch.
   * @returns Data lengkap laporan batch.
   */
  async getBatchParticipantReport(batchId: number) {
    // 1. Ambil data cleaned (hanya latest attempt)
    const filteredParticipants = await this.getFilteredParticipants(batchId);

    // 2. Tentukan Unique Exams dari data participant yg ada
    const uniqueExamsMap = new Map<
      number,
      { id: number; title: string; shortTitle: string }
    >();
    filteredParticipants.forEach((p) => {
      if (!uniqueExamsMap.has(p.exam.id)) {
        uniqueExamsMap.set(p.exam.id, {
          id: p.exam.id,
          title: p.exam.title,
          shortTitle: createAcronym(p.exam.title),
        });
      }
    });
    // Sort Exams (by title)
    const uniqueExams = Array.from(uniqueExamsMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );

    // 3. Susun Score Map: examineeId -> (examId -> score) dan Aggregate
    const scoresMap = new Map<number, Map<number, number>>();
    const aggregateMap = new Map<number, { count: number; total: number }>();

    filteredParticipants.forEach((p) => {
      // Score Map
      if (!scoresMap.has(p.examinee.id))
        scoresMap.set(p.examinee.id, new Map());
      scoresMap.get(p.examinee.id)?.set(p.exam.id, p.final_score || 0);

      // Aggregate
      if (!aggregateMap.has(p.examinee.id))
        aggregateMap.set(p.examinee.id, { count: 0, total: 0 });
      const agg = aggregateMap.get(p.examinee.id)!;
      agg.count++;
      agg.total += p.final_score || 0;
    });

    // 4. Hitung Max Score untuk setiap Unique Exam di batch ini
    //    Kita ambil salah satu participant untuk setiap exam, lalu sum poin generated questions-nya.
    //    ATAU, lebih aman: kita query exam_questions (jika static) atau participant_exam_questions (jika dynamic per user).
    //    Karena sistem ini copy-based (snapshot), kita bisa ambil dari participant mana saja yang sudah dapat soal.
    //    Namun, untuk akurasi batch, idealnya setiap peserta punya soal yang nilainya setara/sama totalnya.
    //    Kita asumsikan total poin ujian itu konsisten per Ujian (Exam ID).

    const examMaxScores = new Map<number, number>();

    // Kita butuh loop async, jadi gunakan for...of
    for (const exam of uniqueExams) {
      // Cari satu peserta (sembarang) yang mengerjakan ujian ini di batch ini
      // Kita bisa gunakan data filteredParticipants
      const sampleParticipant = filteredParticipants.find(
        (p) => p.exam.id === exam.id,
      );

      if (sampleParticipant) {
        // Hitung total poin dari tabel participant_exam_questions
        const questions = await this.peqRepository.find({
          where: { participant: { id: sampleParticipant.id } },
        });
        const totalPoints = questions.reduce((sum, q) => sum + q.point, 0);
        examMaxScores.set(exam.id, totalPoints);
      } else {
        examMaxScores.set(exam.id, 0); // Should not happen if data consistency is good
      }
    }

    // 5. Ambil SEMUA Examinee di batch ini (untuk listing lengkap)
    const allExaminees = await this.examineeRepository.find({
      where: { batch: { id: batchId } },
      order: { name: 'ASC' },
    });

    // 6. Build Final Response
    const participantScores = allExaminees.map((examinee) => {
      const agg = aggregateMap.get(examinee.id) || { count: 0, total: 0 };
      const myScores = scoresMap.get(examinee.id); // Map<examId, score>

      const scoresList = uniqueExams.map((exam) => {
        const rawScore = myScores?.has(exam.id) ? myScores.get(exam.id)! : null;
        const maxScore = examMaxScores.get(exam.id) || 0;

        let percentage = 0;
        if (rawScore !== null && maxScore > 0) {
          percentage = parseFloat(((rawScore / maxScore) * 100).toFixed(2));
        }

        return {
          examId: exam.id,
          score: rawScore, // Legacy support
          rawScore: rawScore, // Explicit naming
          maxScore: maxScore,
          percentage: percentage,
        };
      });

      let totalPercentage = 0;
      let examsTakenCount = 0;
      let totalMaxScore = 0;
      let totalPercentageSum = 0; // NEW: Sum of percentages for Total Column

      scoresList.forEach((s) => {
        // Only count exams taken (where rawScore is not null)
        if (s.rawScore !== null) {
          // Accumulate percentages for average calculation
          totalPercentage += s.percentage;
          examsTakenCount++;

          // Accumulate max score for this exam to the total max score
          totalMaxScore += s.maxScore;

          // NEW: Accumulate percentage for Total sum
          totalPercentageSum += s.percentage;
        }
      });

      const averagePercentage =
        examsTakenCount > 0
          ? parseFloat((totalPercentage / examsTakenCount).toFixed(2))
          : 0;

      return {
        examinee: {
          id: examinee.id,
          name: examinee.name,
          avatar: examinee.avatar_url,
          workplace: examinee.workplace,
        },
        examCount: agg.count,
        totalScore: agg.total, // Raw Total
        totalMaxScore,
        totalPercentageSum, // NEW
        averageScore:
          agg.count > 0 ? parseFloat((agg.total / agg.count).toFixed(2)) : 0, // Raw Average
        averagePercentage,
        scores: scoresList,
      };
    });

    return {
      uniqueExams,
      participantScores,
    };
  }

  /**
   * Membuat Laporan Rata-rata Batch per Ujian.
   * Digunakan untuk visualisasi grafik batang (Bar Chart).
   *
   * @param batchId ID Batch.
   * @returns List ujian beserta rata-rata nilainya.
   */
  async getBatchAverageReport(batchId: number) {
    const filteredParticipants = await this.getFilteredParticipants(batchId);

    // Group by Exam and sum/count
    const examAggregates = new Map<
      number,
      { title: string; count: number; total: number }
    >();

    filteredParticipants.forEach((p) => {
      if (!examAggregates.has(p.exam.id)) {
        examAggregates.set(p.exam.id, {
          title: p.exam.title,
          count: 0,
          total: 0,
        });
      }
      const agg = examAggregates.get(p.exam.id)!;
      agg.count++;
      agg.total += p.final_score || 0;
    });

    const report = Array.from(examAggregates.entries()).map(
      ([examId, data]) => ({
        examId: examId,
        examTitle: data.title,
        averageScore: (data.total / data.count).toFixed(2),
      }),
    );

    // Sort by Title
    report.sort((a, b) => a.examTitle.localeCompare(b.examTitle));

    return report;
  }

  /**
   * Mendapatkan daftar unik ujian yang ada di batch ini.
   * Digunakan untuk mengisi opsi dropdown filter di frontend.
   *
   * @param batchId ID Batch.
   * @returns List ujian unik.
   */
  async getBatchUniqueExams(batchId: number) {
    // Reuse filtered participants to ensure consistency
    const filteredParticipants = await this.getFilteredParticipants(batchId);

    const uniqueExamsMap = new Map<number, { id: number; title: string }>();
    filteredParticipants.forEach((p) => {
      if (!uniqueExamsMap.has(p.exam.id)) {
        uniqueExamsMap.set(p.exam.id, {
          id: p.exam.id,
          title: p.exam.title,
        });
      }
    });

    return Array.from(uniqueExamsMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }

  /**
   * Membuat Laporan Detail Performa Batch pada Satu Ujian Spesifik.
   * Menampilkan skor setiap peserta untuk ujian tersebut.
   *
   * @param batchId ID Batch.
   * @param examId ID Ujian.
   * @returns List peserta dan skornya di ujian ini.
   */
  async getBatchExamPerformance(batchId: number, examId: number) {
    const filtered = await this.getFilteredParticipants(batchId);
    const examParticipants = new Map<number, Participant>();

    // Filter specifically for this exam
    filtered.forEach((p) => {
      if (p.exam.id === +examId) examParticipants.set(p.examinee.id, p);
    });

    const allExaminees = await this.examineeRepository.find({
      where: { batch: { id: batchId } },
      order: { name: 'ASC' },
    });

    return allExaminees.map((examinee) => {
      const p = examParticipants.get(examinee.id);
      return {
        name: examinee.name,
        score: p ? p.final_score || 0 : 0,
        avatar_url: examinee.avatar_url,
      };
    });
  }

  /**
   * Mengenerate file Excel report untuk Batch.
   * Berisi dua sheet: Rangkuman Nilai Peserta dan Rangkuman Rata-rata Ujian.
   *
   * @param batchId ID Batch.
   * @param type Tipe skor yang ditampilkan (raw/normalized/both).
   * @returns Buffer file Excel.
   */
  async exportBatchReport(
    batchId: number,
    type: 'raw' | 'normalized' | 'both' = 'both',
  ): Promise<Buffer> {
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
      // Calculate normalized total percentage
      // For sum of percentages, we use totalPercentageSum directly
      let totalPercentageVal = participant.totalPercentageSum;

      // Legacy calculation fallback (if needed, but we want sum generally)
      // let totalPercentageVal = 0;
      // if (participant.totalMaxScore > 0) {
      //   totalPercentageVal = parseFloat(
      //     ((participant.totalScore / participant.totalMaxScore) * 100).toFixed(
      //       2,
      //     ),
      //   );
      // }

      // Determine display values for Total and Average
      let totalScoreDisplay: string | number = participant.totalScore;
      let averageScoreDisplay: string | number = parseFloat(
        participant.averageScore.toFixed(2),
      );

      if (type === 'raw') {
        totalScoreDisplay = participant.totalScore;
        // For raw average, we use the raw average score calculated previously
        averageScoreDisplay = parseFloat(participant.averageScore.toFixed(2));
      } else if (type === 'normalized') {
        totalScoreDisplay = totalPercentageVal;
        averageScoreDisplay = participant.averagePercentage;
      } else {
        // Both
        totalScoreDisplay = `${totalPercentageVal} (${participant.totalScore}/${participant.totalMaxScore})`;
        averageScoreDisplay = `${participant.averagePercentage} (${participant.averageScore.toFixed(
          2,
        )})`;
      }

      // Siapkan data baris
      const rowData: any = {
        name: participant.examinee.name,
        examCount: participant.examCount,
        totalScore: totalScoreDisplay,
        averageScore: averageScoreDisplay,
      };

      // Masukkan nilai untuk setiap ujian
      participant.scores.forEach((score) => {
        let displayValue: string | number = '-';

        if (score.rawScore !== null) {
          if (type === 'raw') {
            displayValue = score.rawScore; // Show only the raw number
          } else if (type === 'normalized') {
            displayValue = score.percentage;
          } else {
            // Both
            displayValue = `${score.percentage} (${score.rawScore}/${score.maxScore})`;
          }
        }

        rowData[`exam_${score.examId}`] = displayValue;
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

  /**
   * Helper Private: Mengambil data partisipan yang sudah difilter.
   * Hanya mengambil ATTEMPT TERAKHIR (Latest Attempt) untuk setiap kombinasi Peserta-Ujian.
   * Memastikan data yang diolah tidak duplikat.
   */
  private async getFilteredParticipants(
    batchId: number,
  ): Promise<Participant[]> {
    const rawParticipants = await this.participantRepository.find({
      where: {
        examinee: { batch: { id: batchId } },
        status: ParticipantStatus.FINISHED,
      },
      relations: ['examinee', 'exam'],
    });

    const latestAttempts = new Map<string, Participant>();

    rawParticipants.forEach((p) => {
      const key = `${p.examinee.id}_${p.exam.id}`;
      const existing = latestAttempts.get(key);
      const currentAttempt = p.attempt_number || 1;
      const existingAttempt = existing ? existing.attempt_number || 1 : 0;

      if (currentAttempt > existingAttempt) {
        latestAttempts.set(key, p);
      }
    });

    return Array.from(latestAttempts.values());
  }
}
