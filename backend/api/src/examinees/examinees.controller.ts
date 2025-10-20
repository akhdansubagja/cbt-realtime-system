// src/examinees/examinees.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
  findAll() {
    return this.examineesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examineesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamineeDto: UpdateExamineeDto) {
    return this.examineesService.update(+id, updateExamineeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examineesService.remove(+id);
  }
}