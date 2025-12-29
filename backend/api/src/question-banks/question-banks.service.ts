import { Injectable } from '@nestjs/common';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionBank } from './entities/question-bank.entity';
import { Repository, Like, ILike, Not, IsNull } from 'typeorm';
import { Question } from 'src/questions/entities/question.entity';

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  has_image?: string;
}

@Injectable()
export class QuestionBanksService {
  constructor(
    @InjectRepository(QuestionBank)
    private readonly questionBankRepository: Repository<QuestionBank>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  create(createQuestionBankDto: CreateQuestionBankDto) {
    const newBank = this.questionBankRepository.create(createQuestionBankDto);
    return this.questionBankRepository.save(newBank);
  }

  /**
   * Mengambil daftar bank soal dengan jumlah soal di setiap bank.
   */
  findAll() {
    return this.questionBankRepository
      .createQueryBuilder('question_bank')
      .loadRelationCountAndMap(
        'question_bank.total_questions',
        'question_bank.questions',
      )
      .orderBy('question_bank.name', 'ASC')
      .getMany();
  }

  /**
   * Mengambil detail bank soal beserta seluruh soal di dalamnya.
   */
  findOne(id: number) {
    // Tambahkan 'relations' untuk mengambil semua soal yang terhubung
    return this.questionBankRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
  }

  /**
   * Mencari dan memfilter soal di dalam bank soal tertentu.
   * Mendukung pagination, pencarian teks, dan filter gambar.
   */
  async findQuestionsForBank(bankId: number, options: PaginationOptions) {
    const { page, limit, search, has_image } = options;
    const skip = (page - 1) * limit;

    const where: any = { bank: { id: bankId } };

    if (search) {
      where.question_text = ILike(`%${search}%`);
    }

    if (has_image === 'true') {
      where.image_url = Not(IsNull());
    } else if (has_image === 'false') {
      where.image_url = IsNull();
    }

    const [data, total] = await this.questionRepository.findAndCount({
      where: where,
      order: { id: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  // --- TAMBAHKAN LOGIKA UPDATE DI SINI ---
  /**
   * Mengupdate data bank soal.
   */
  async update(id: number, updateQuestionBankDto: UpdateQuestionBankDto) {
    // Perbarui data di database
    await this.questionBankRepository.update(id, updateQuestionBankDto);
    // Ambil dan kembalikan data yang sudah diperbarui
    return this.questionBankRepository.findOneBy({ id });
  }

  // --- TAMBAHKAN LOGIKA DELETE DI SINI ---
  /**
   * Menghapus bank soal.
   */
  async remove(id: number) {
    // Hapus data dari database
    return this.questionBankRepository.delete(id);
  }

  /**
   * Mengexport soal ke dalam format DOCX atau PDF.
   * Mendukung filter subset soal berdasarkan ID.
   */
  async exportQuestions(
    bankId: number,
    format: 'docx' | 'pdf',
    ids?: number[],
  ): Promise<Buffer> {
    const bank = await this.findOne(bankId);
    if (!bank) {
      throw new Error('Question Bank not found');
    }

    let questions = bank.questions || [];

    if (ids && ids.length > 0) {
      questions = questions.filter((q) => ids.includes(q.id));
    }

    if (format === 'docx') {
      return this.generateDocx(bank.name, questions);
    } else if (format === 'pdf') {
      return this.generatePdf(bank.name, questions);
    } else {
      throw new Error('Unsupported format');
    }
  }

  private async generateDocx(
    title: string,
    questions: Question[],
  ): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      AlignmentType,
      ImageRun,
    } = require('docx');

    const children = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '' }), // Spacer
    ];

    const fs = require('fs');
    const path = require('path');

    questions.forEach((q, index) => {
      // 1. Question Text
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${q.question_text}`,
              bold: true,
            }),
          ],
        }),
      );

      // 2. Question Image (if exists)
      if (q.image_url) {
        try {
          // image_url format: "/uploads/filename.jpg"
          // We need to construct the absolute path
          // Assuming the app runs from root or similar, we need process.cwd()
          const filename = q.image_url.replace('/uploads/', '');
          const imagePath = path.join(process.cwd(), 'uploads', filename);

          if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);

            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 300,
                      height: 300, // Aspect ratio is usually preserved if one dim is set, but docx might need both or logic.
                      // Let's try setting width only if library supports it, or both.
                      // Docx ImageRun usually requires width/height.
                      // For now, 300x300 might distort. Ideally we get dimensions.
                      // But without 'image-size' lib, we might just set hard limits or rely on docx scaler.
                      // Let's set generic 300x300, user didn't ask for perfect aspect ratio logic, just "reasonable width". "300px"
                    },
                  }),
                ],
              }),
            );
          }
        } catch (err) {
          console.error(`Failed to embed image for Q${q.id}:`, err);
        }
      }

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          children.push(
            new Paragraph({
              text: `${opt.key}. ${opt.text}`,
              indent: { left: 720 }, // 0.5 inch
            }),
          );
        });
      }

      children.push(new Paragraph({ text: '' })); // Spacer
    });

    // Add Answer Key Section
    children.push(
      new Paragraph({
        text: 'Kunci Jawaban',
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
      }),
    );

    questions.forEach((q, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${q.correct_answer}`,
        }),
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  private async generatePdf(
    title: string,
    questions: Question[],
  ): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFDocument = require('pdfkit');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Title
      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();

      // Questions
      doc.fontSize(12);
      questions.forEach((q, index) => {
        const fs = require('fs');
        const path = require('path');

        doc.font('Helvetica-Bold').text(`${index + 1}. ${q.question_text}`);
        doc.font('Helvetica');

        // Embed Image
        if (q.image_url) {
          try {
            // q.image_url is like "/uploads/foo.jpg"
            const filename = q.image_url.replace('/uploads/', '');
            const imagePath = path.join(process.cwd(), 'uploads', filename);

            if (fs.existsSync(imagePath)) {
              doc.moveDown(0.5);
              doc.image(imagePath, { fit: [200, 200], align: 'left' });
              doc.moveDown(0.5);
            }
          } catch (err) {
            console.error(`Error embedding image in PDF for Q${q.id}`, err);
          }
        }

        if (q.options && q.options.length > 0) {
          q.options.forEach((opt) => {
            doc.text(`${opt.key}. ${opt.text}`, { indent: 20 });
          });
        }
        doc.moveDown();
      });

      // Answer Key
      doc.addPage();
      doc.fontSize(16).text('Kunci Jawaban', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);

      questions.forEach((q, index) => {
        doc.text(`${index + 1}. ${q.correct_answer}`);
      });

      doc.end();
    });
  }
}
