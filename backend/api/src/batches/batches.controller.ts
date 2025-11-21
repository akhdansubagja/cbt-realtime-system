import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

import { ExamineesService } from 'src/examinees/examinees.service';

@Controller('batches')
export class BatchesController {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly examineesService: ExamineesService, // Inject ini
  ) {}

  @Post()
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }
  @Get()
  findAll() {
    return this.batchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, updateBatchDto);
  }

  @Patch(':id/status') // Endpoint baru
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { is_active: boolean },
  ) {
    return this.examineesService.updateBulkStatusByBatch(id, body.is_active);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.batchesService.remove(id);
  }
}
