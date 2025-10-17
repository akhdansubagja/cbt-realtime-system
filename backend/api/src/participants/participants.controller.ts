// src/participants/participants.controller.ts

import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { JoinExamDto } from './dto/join-exam.dto';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post('join') // Endpoint: POST /participants/join
  joinExam(@Body() joinExamDto: JoinExamDto) {
    return this.participantsService.joinExam(joinExamDto);
  }

  @Get(':id/start') // Endpoint: GET /participants/4/start
  getExamQuestions(@Param('id') id: string) {
    return this.participantsService.getExamQuestions(+id); // Tanda '+' mengubah string 'id' menjadi number
  }

  @Post(':id/begin') // Endpoint: POST /participants/12/begin
  beginExam(@Param('id') id: string) {
    return this.participantsService.beginExam(+id);
  }

  @Post(':id/finish') // Endpoint: POST /participants/9/finish
  finishExam(@Param('id') id: string) {
    return this.participantsService.finishExam(+id);
  }

  @Get(':id/answers')
  getParticipantAnswers(@Param('id') id: string) {
    return this.participantsService.getParticipantAnswers(+id);
  }
}
