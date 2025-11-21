import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './entities/batch.entity';

import { ExamineesModule } from 'src/examinees/examinees.module';

@Module({
  imports: [TypeOrmModule.forFeature([Batch]), ExamineesModule],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
