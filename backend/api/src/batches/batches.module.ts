import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Batch])],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
