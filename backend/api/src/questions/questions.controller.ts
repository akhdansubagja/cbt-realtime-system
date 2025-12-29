import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseIntPipe, // <-- Tambahan Disarankan: Validasi ID harus angka
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateBulkQuestionsDto } from './dto/create-bulk-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // --- ENDPOINT UPLOAD (Terpisah) ---
  /**
   * Mengunggah file gambar untuk soal.
   * File disimpan di disk storage lokal.
   *
   * @param file File gambar yang diunggah.
   * @returns URL relatif file yang diunggah.
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(
            new Error('Hanya file gambar yang diizinkan!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Mengembalikan path relatif yang akan disimpan di DB oleh frontend
    return {
      url: `/uploads/${file.filename}`,
    };
  }

  // --- ENDPOINT CRUD ---

  /**
   * Membuat satu soal baru.
   *
   * @param createQuestionDto Data soal baru.
   */
  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  /**
   * Membuat banyak soal sekaligus (Import).
   * Menerima array file untuk gambar soal jika ada.
   *
   * @param body Body request berisi data JSON string 'data'.
   * @param files Array file gambar.
   */
  @Post('bulk')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(
            new Error('Hanya file gambar yang diizinkan!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  createBulk(
    @Body() body: { data: string },
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const createBulkDto: CreateBulkQuestionsDto = JSON.parse(body.data);
    return this.questionsService.createBulk(createBulkDto, files);
  }

  /**
   * Mengambil semua daftar soal.
   */
  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  /**
   * Mengambil detail soal berdasarkan ID.
   *
   * @param id ID soal.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // Gunakan ParseIntPipe agar aman
    return this.questionsService.findOne(id);
  }

  /**
   * Mengupdate data soal.
   *
   * @param id ID soal.
   * @param updateQuestionDto Data update.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  /**
   * Menghapus soal.
   *
   * @param id ID soal.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }
}
