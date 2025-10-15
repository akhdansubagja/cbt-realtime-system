import { Test, TestingModule } from '@nestjs/testing';
import { ExamineesController } from './examinees.controller';
import { ExamineesService } from './examinees.service';

describe('ExamineesController', () => {
  let controller: ExamineesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamineesController],
      providers: [ExamineesService],
    }).compile();

    controller = module.get<ExamineesController>(ExamineesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
