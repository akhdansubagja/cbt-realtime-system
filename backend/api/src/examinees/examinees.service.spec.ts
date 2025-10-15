import { Test, TestingModule } from '@nestjs/testing';
import { ExamineesService } from './examinees.service';

describe('ExamineesService', () => {
  let service: ExamineesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamineesService],
    }).compile();

    service = module.get<ExamineesService>(ExamineesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
