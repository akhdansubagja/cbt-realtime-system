// src/examinees/examinees.controller.ts

import { Controller, Get, Post, Body } from '@nestjs/common';
import { ExamineesService } from './examinees.service';
import { CreateExamineeDto } from './dto/create-examinee.dto';

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
}