import { Test, TestingModule } from '@nestjs/testing';
import { QuestionBanksService } from './question-banks.service';

describe('QuestionBanksService', () => {
  let service: QuestionBanksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionBanksService],
    }).compile();

    service = module.get<QuestionBanksService>(QuestionBanksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
