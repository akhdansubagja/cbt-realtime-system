// cbt-realtime-system/backend/api/src/question-banks/question-banks.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { QuestionBanksController } from './question-banks.controller';
import { QuestionBanksService } from './question-banks.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { QuestionBank } from './entities/question-bank.entity';

// Membuat mock/tiruan dari QuestionBanksService dengan semua metodenya
const mockQuestionBanksService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findQuestionsForBank: jest.fn(),
};

describe('QuestionBanksController', () => {
  let controller: QuestionBanksController;
  let service: QuestionBanksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionBanksController],
      providers: [
        {
          provide: QuestionBanksService,
          useValue: mockQuestionBanksService,
        },
      ],
    }).compile();

    controller = module.get<QuestionBanksController>(QuestionBanksController);
    service = module.get<QuestionBanksService>(QuestionBanksService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new question bank', async () => {
      const createDto = new CreateQuestionBankDto();
      const createdBank = new QuestionBank();
      mockQuestionBanksService.create.mockResolvedValue(createdBank);

      const result = await controller.create(createDto);

      expect(result).toEqual(createdBank);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of question banks', async () => {
      const allBanks = [new QuestionBank()];
      mockQuestionBanksService.findAll.mockResolvedValue(allBanks);

      const result = await controller.findAll();

      expect(result).toEqual(allBanks);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single question bank', async () => {
      const bankId = '1';
      const singleBank = new QuestionBank();
      mockQuestionBanksService.findOne.mockResolvedValue(singleBank);

      const result = await controller.findOne(bankId);

      expect(result).toEqual(singleBank);
      expect(service.findOne).toHaveBeenCalledWith(+bankId);
    });
  });

  describe('update', () => {
    it('should update a question bank', async () => {
      const bankId = '1';
      const updateDto = new UpdateQuestionBankDto();
      const updatedBank = new QuestionBank();
      mockQuestionBanksService.update.mockResolvedValue(updatedBank);

      const result = await controller.update(bankId, updateDto);

      expect(result).toEqual(updatedBank);
      expect(service.update).toHaveBeenCalledWith(+bankId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a question bank', async () => {
      const bankId = '1';
      mockQuestionBanksService.remove.mockResolvedValue({ affected: 1 });

      await controller.remove(bankId);

      expect(service.remove).toHaveBeenCalledWith(+bankId);
    });
  });

  describe('findQuestions', () => {
    it('should return paginated questions for a bank', async () => {
        const bankId = '1';
        const paginatedResult = { data: [], total: 0, page: 1, last_page: 1 };
        mockQuestionBanksService.findQuestionsForBank.mockResolvedValue(paginatedResult);

        const result = await controller.findQuestions(bankId, '1', '10');

        expect(result).toEqual(paginatedResult);
        expect(service.findQuestionsForBank).toHaveBeenCalledWith(+bankId, { page: 1, limit: 10 });
    });
  });
});