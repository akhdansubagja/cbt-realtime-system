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

  findAll() {
    return this.questionBankRepository.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    // Tambahkan 'relations' untuk mengambil semua soal yang terhubung
    return this.questionBankRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
  }

  async findQuestionsForBank(bankId: number, options: PaginationOptions) {
    const { page, limit, search, has_image } = options;
    const skip = (page - 1) * limit;

    const where: any = { bank: { id: bankId } };

    if (search) {
      where.question_text = ILike(`%${search}%`);
    }

    if (has_image === 'true') {
      where.image_url = Not(IsNull());
      // If you also want to exclude empty strings:
      // where.image_url = And(Not(IsNull()), Not(""));
      // But usually checking Not(IsNull()) is enough if default is null.
      // Let's assume Not(IsNull()) and Not('') if possible, but TypeORM simple find options might be tricky for OR/AND combinations on same field without QueryBuilder.
      // For simplicity with simple find options:
      // If we need strict check for non-empty, we might need QueryBuilder.
      // Let's stick to simple find for now. If image_url is nullable, Not(IsNull()) is good.
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
  async update(id: number, updateQuestionBankDto: UpdateQuestionBankDto) {
    // Perbarui data di database
    await this.questionBankRepository.update(id, updateQuestionBankDto);
    // Ambil dan kembalikan data yang sudah diperbarui
    return this.questionBankRepository.findOneBy({ id });
  }

  // --- TAMBAHKAN LOGIKA DELETE DI SINI ---
  async remove(id: number) {
    // Hapus data dari database
    return this.questionBankRepository.delete(id);
  }

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
    } = require('docx');

    const children = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '' }), // Spacer
    ];

    questions.forEach((q, index) => {
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
        doc.font('Helvetica-Bold').text(`${index + 1}. ${q.question_text}`);
        doc.font('Helvetica');

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
