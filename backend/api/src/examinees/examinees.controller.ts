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
} from '@nestjs/common';
import { ExamineesService } from './examinees.service';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';

@Controller('examinees')
export class ExamineesController {
  constructor(private readonly examineesService: ExamineesService) {}

  @Post()
  create(@Body() createExamineeDto: CreateExamineeDto) {
    return this.examineesService.create(createExamineeDto);
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
  update(
    @Param('id') id: string,
    @Body() updateExamineeDto: UpdateExamineeDto,
  ) {
    return this.examineesService.update(+id, updateExamineeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examineesService.remove(+id);
  }
}
