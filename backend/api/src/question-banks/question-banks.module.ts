// src/question-banks/question-banks.module.ts

import { Module } from '@nestjs/common';
import { QuestionBanksService } from './question-banks.service';
import { QuestionBanksController } from './question-banks.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { QuestionBank } from './entities/question-bank.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([QuestionBank])],
  controllers: [QuestionBanksController],
  providers: [QuestionBanksService],
})
export class QuestionBanksModule {}