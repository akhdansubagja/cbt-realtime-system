import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuestionBanksService } from './question-banks.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';

@Controller('question-banks')
export class QuestionBanksController {
  constructor(private readonly questionBanksService: QuestionBanksService) {}

  @Post()
  create(@Body() createQuestionBankDto: CreateQuestionBankDto) {
    return this.questionBanksService.create(createQuestionBankDto);
  }

  @Get()
  findAll() {
    return this.questionBanksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionBanksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestionBankDto: UpdateQuestionBankDto) {
    return this.questionBanksService.update(+id, updateQuestionBankDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionBanksService.remove(+id);
  }
}
