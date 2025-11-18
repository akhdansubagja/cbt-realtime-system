import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from './entities/question.entity';
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
    const newQuestion = this.questionRepository.create({
      ...createQuestionDto,
      bank: { id: createQuestionDto.bank_id },
    });
    return this.questionRepository.save(newQuestion);
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

    // 2. LOGIKA HAPUS FILE LAMA (Jika Gambar Diganti)
    // Cek: Apakah di payload ada image_url DAN image_url-nya beda dengan yang lama?
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
    const { bank_id, ...rest } = updateQuestionDto;
    const payload: Partial<Question> = { ...rest };

    if (bank_id) {
      payload.bank = { id: bank_id } as any;
    }

    await this.questionRepository.update(id, payload as any);
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
