import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('batch-participants/:id')
  getBatchParticipantReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchParticipantReport(id);
  }

  @Get('batch-averages/:id')
  getBatchAverageReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getBatchAverageReport(id);
  }
}
