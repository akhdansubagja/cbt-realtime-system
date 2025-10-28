// src/participants/participants.controller.ts

import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { JoinExamDto } from './dto/join-exam.dto';
import { ParticipantGuard } from 'src/auth/guards/participant.guard';


@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post('join') // Endpoint: POST /participants/join
  joinExam(@Body() joinExamDto: JoinExamDto) {
    return this.participantsService.joinExam(joinExamDto);
  }

  @UseGuards(ParticipantGuard)
  @Get(':id/start') // Endpoint: GET /participants/4/start
  getExamQuestions(@Param('id') id: string) {
    return this.participantsService.getExamQuestions(+id); // Tanda '+' mengubah string 'id' menjadi number
  }

  @UseGuards(ParticipantGuard)
  @Post(':id/begin') // Endpoint: POST /participants/12/begin
  beginExam(@Param('id') id: string) {
    return this.participantsService.beginExam(+id);
  }

  @UseGuards(ParticipantGuard)
  @Post(':id/finish') // Endpoint: POST /participants/9/finish
  finishExam(@Param('id') id: string) {
    return this.participantsService.finishExam(+id);
  }

  @UseGuards(ParticipantGuard)
  @Get(':id/answers')
  getParticipantAnswers(@Param('id') id: string) {
    return this.participantsService.getParticipantAnswers(+id);
  }

  @Get(':id')
  @UseGuards(ParticipantGuard) // Kita amankan juga endpoint ini
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(+id);
  }
}
