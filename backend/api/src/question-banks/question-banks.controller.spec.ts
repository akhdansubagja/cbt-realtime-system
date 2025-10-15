import { Test, TestingModule } from '@nestjs/testing';
import { QuestionBanksController } from './question-banks.controller';
import { QuestionBanksService } from './question-banks.service';

describe('QuestionBanksController', () => {
  let controller: QuestionBanksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionBanksController],
      providers: [QuestionBanksService],
    }).compile();

    controller = module.get<QuestionBanksController>(QuestionBanksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
