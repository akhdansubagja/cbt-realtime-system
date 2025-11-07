// src/examinees/examinees.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { ExamineesService } from './examinees.service';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import File from 'multer';
import { CreateBulkExamineesDto } from './dto/create-bulk-examinees.dto';

@Controller('examinees')
export class ExamineesController {
  constructor(private readonly examineesService: ExamineesService) {}

  @Post('bulk-with-avatars')
  @UseInterceptors(FilesInterceptor('avatars', 50)) // Menerima hingga 50 file
  createBulkWithAvatars(
    @Body() createBulkExamineesDto: CreateBulkExamineesDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.examineesService.createBulkWithAvatars(
      createBulkExamineesDto,
      files,
    );
  }

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  create(
    @Body() createExamineeDto: CreateExamineeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Nanti kita akan teruskan 'file' ini ke service
    return this.examineesService.create(createExamineeDto, file);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string, // <-- Tambahkan ini
  ) {
    return this.examineesService.findAll(
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
      search, // <-- Kirimkan search ke service
    );
  }

  @Get('all/simple')
  findAllSimple() {
    return this.examineesService.findAllSimple();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examineesService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamineeDto: UpdateExamineeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Nanti kita akan teruskan 'file' ini ke service
    return this.examineesService.update(id, updateExamineeDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examineesService.remove(+id);
  }
}
