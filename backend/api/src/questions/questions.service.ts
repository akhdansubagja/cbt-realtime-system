import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateBulkQuestionsDto } from './dto/create-bulk-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question, QuestionType } from './entities/question.entity';
import { promises as fs } from 'fs'; // Import filesystem
import { join } from 'path';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  // Helper Private: Untuk menghapus file fisik berdasarkan URL
  private async deleteImageFile(imageUrl: string) {
    if (!imageUrl) return;

    // URL di database biasanya format: "/uploads/namafile.jpg"
    // Kita perlu ubah jadi path fisik sistem: "C:\project\uploads\namafile.jpg"
    const filename = imageUrl.replace('/uploads/', '');
    const filePath = join(process.cwd(), 'uploads', filename);

    try {
      await fs.unlink(filePath);
      console.log(`[Questions] File gambar dihapus: ${filePath}`);
    } catch (err) {
      // Kita hanya log error (misal file sudah hilang duluan), jangan stop proses
      console.error(`[Questions] Gagal menghapus file: ${err.message}`);
    }
  }

  async create(createQuestionDto: CreateQuestionDto) {
    const payload = { ...createQuestionDto };
    if (payload.image_url === '') {
      payload.image_url = undefined; // or null, but undefined works with TypeORM create
    }

    const newQuestion = this.questionRepository.create({
      ...payload,
      bank: { id: createQuestionDto.bank_id },
    });
    return this.questionRepository.save(newQuestion);
  }

  async createBulk(
    createBulkDto: CreateBulkQuestionsDto,
    files: Array<Express.Multer.File> = [],
  ) {
    const { bankId, questions } = createBulkDto;

    // Validate bank exists (optional but good practice)
    // const bank = await this.bankRepository.findOneBy({ id: bankId });
    // if (!bank) throw new NotFoundException('Bank not found');

    const entities = questions.map((q, index) => {
      // Map options to the format expected by the entity (assuming JSONB or similar)
      // Based on existing code: options: { key: string; text: string }[]
      // But DTO has { text, isCorrect }
      // We need to assign keys (A, B, C...) automatically

      const mappedOptions = q.options.map((opt, index) => ({
        key: String.fromCharCode(65 + index), // A, B, C...
        text: opt.text,
      }));

      // Find correct answer key
      const correctOptionIndex = q.options.findIndex((opt) => opt.isCorrect);
      const correctAnswer =
        correctOptionIndex !== -1
          ? String.fromCharCode(65 + correctOptionIndex)
          : '';

      // Find image for this question index
      // Frontend sends 'images_0', 'images_1', etc.
      const imageFile = files.find((f) => f.fieldname === `images_${index}`);
      const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : undefined;

      return this.questionRepository.create({
        question_text: q.text,
        question_type:
          q.type === 'multiple_choice'
            ? QuestionType.MULTIPLE_CHOICE
            : QuestionType.MULTIPLE_CHOICE, // Default to MC for now as enum only has MC
        options: mappedOptions,
        correct_answer: correctAnswer,
        bank: { id: bankId },
        image_url: imageUrl,
      });
    });

    // Use save for bulk insert (TypeORM handles this efficiently)
    return this.questionRepository.save(entities);
  }

  findAll() {
    return this.questionRepository.find({ relations: ['bank'] });
  }

  findOne(id: number) {
    return this.questionRepository.findOneBy({ id });
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto) {
    // 1. Ambil data lama untuk pengecekan
    const existingQuestion = await this.findOne(id);
    if (!existingQuestion) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const payload: Partial<Question> = { ...updateQuestionDto };

    // Fix: If image_url is an empty string, treat it as null to clear the field
    if (payload.image_url === '') {
      payload.image_url = null; // Use null to explicitly clear it in DB update
    }

    // 2. LOGIKA HAPUS FILE LAMA (Jika Gambar Diganti atau Dihapus)
    // Cek: Apakah di payload ada image_url (bisa null atau string)
    // DAN image_url-nya beda dengan yang lama?
    // Ini mencakup kasus:
    // a) existing.image_url = '/uploads/old.jpg', payload.image_url = '/uploads/new.jpg' (ganti gambar)
    // b) existing.image_url = '/uploads/old.jpg', payload.image_url = null (hapus gambar)
    if (
      updateQuestionDto.image_url !== undefined && // User mengirim field image_url
      updateQuestionDto.image_url !== existingQuestion.image_url // Dan isinya berbeda
    ) {
      // Jika soal punya gambar lama, hapus dulu
      if (existingQuestion.image_url) {
        await this.deleteImageFile(existingQuestion.image_url);
      }
    }

    // 3. Update Database
    // Use the processed payload (which deals with image_url nulls)
    const finalPayload: any = { ...payload };

    // TypeORM throws if 'bank_id' is present but not a column. Remove it.
    delete finalPayload.bank_id;

    if (updateQuestionDto.bank_id) {
      finalPayload.bank = { id: updateQuestionDto.bank_id };
    }

    await this.questionRepository.update(id, finalPayload);

    return this.findOne(id);
  }

  async remove(id: number) {
    // 1. Cari data dulu sebelum dihapus
    const question = await this.findOne(id);

    if (question) {
      // 2. Jika ada gambar, hapus file fisiknya
      if (question.image_url) {
        await this.deleteImageFile(question.image_url);
      }
      // 3. Hapus dari database
      return this.questionRepository.delete(id);
    }

    throw new NotFoundException(`Question with ID ${id} not found`);
  }
}
