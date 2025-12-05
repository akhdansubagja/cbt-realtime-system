import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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
  update(
    @Param('id') id: string,
    @Body() updateQuestionBankDto: UpdateQuestionBankDto,
  ) {
    return this.questionBanksService.update(+id, updateQuestionBankDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionBanksService.remove(+id);
  }

  @Get(':id/questions')
  findQuestions(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('has_image') has_image?: string,
  ) {
    return this.questionBanksService.findQuestionsForBank(+id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      has_image,
    });
  }

  @Get(':id/export')
  async export(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('format') format: 'docx' | 'pdf' = 'docx',
    @Query('ids') ids?: string,
  ) {
    const idList = ids ? ids.split(',').map(Number) : undefined;
    const buffer = await this.questionBanksService.exportQuestions(
      +id,
      format,
      idList,
    );

    const filename = `question-bank-${id}.${format}`;
    const contentType =
      format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
