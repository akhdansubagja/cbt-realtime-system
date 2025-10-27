// cbt-realtime-system/backend/api/src/question-banks/question-banks.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { QuestionBanksService } from './question-banks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuestionBank } from './entities/question-bank.entity';
import { Question } from '../questions/entities/question.entity';
import { Repository } from 'typeorm';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';

// Membuat mock untuk kedua repository yang dibutuhkan
const mockQuestionBankRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockQuestionRepository = {
  findAndCount: jest.fn(),
};

describe('QuestionBanksService', () => {
  let service: QuestionBanksService;
  let questionBankRepository: Repository<QuestionBank>;
  let questionRepository: Repository<Question>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionBanksService,
        {
          provide: getRepositoryToken(QuestionBank),
          useValue: mockQuestionBankRepository,
        },
        {
          provide: getRepositoryToken(Question),
          useValue: mockQuestionRepository,
        },
      ],
    }).compile();

    service = module.get<QuestionBanksService>(QuestionBanksService);
    questionBankRepository = module.get<Repository<QuestionBank>>(
      getRepositoryToken(QuestionBank),
    );
    questionRepository = module.get<Repository<Question>>(
      getRepositoryToken(Question),
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new question bank', async () => {
      const createDto = {
        name: 'Bank Soal Fisika',
        description: 'Materi Kelas 10',
      } as CreateQuestionBankDto;
      const newBank = new QuestionBank();

      mockQuestionBankRepository.create.mockReturnValue(newBank);
      mockQuestionBankRepository.save.mockResolvedValue({ ...newBank, id: 1 });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(questionBankRepository.create).toHaveBeenCalledWith(createDto);
      expect(questionBankRepository.save).toHaveBeenCalledWith(newBank);
    });
  });

  describe('findAll', () => {
    it('should return an array of question banks', async () => {
      const mockBanks = [new QuestionBank()];
      mockQuestionBankRepository.find.mockResolvedValue(mockBanks);

      const result = await service.findAll();

      expect(result).toEqual(mockBanks);
      expect(questionBankRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single question bank with its questions', async () => {
      const bankId = 1;
      const mockBank = new QuestionBank();
      mockQuestionBankRepository.findOne.mockResolvedValue(mockBank);

      const result = await service.findOne(bankId);

      expect(result).toEqual(mockBank);
      expect(questionBankRepository.findOne).toHaveBeenCalledWith({
        where: { id: bankId },
        relations: ['questions'],
      });
    });
  });

  describe('findQuestionsForBank', () => {
    it('should return paginated questions for a specific bank', async () => {
      const bankId = 1;
      const options = { page: 1, limit: 10 };
      const mockQuestions = [new Question()];
      const total = 1;
      mockQuestionRepository.findAndCount.mockResolvedValue([
        mockQuestions,
        total,
      ]);

      const result = await service.findQuestionsForBank(bankId, options);

      expect(result.data).toEqual(mockQuestions);
      expect(result.total).toBe(total);
      expect(questionRepository.findAndCount).toHaveBeenCalledWith({
        where: { bank: { id: bankId } },
        order: { id: 'DESC' },
        take: options.limit,
        skip: 0,
      });
    });
  });

  describe('update', () => {
    it('should update a question bank and return the updated entity', async () => {
      const bankId = 1;
      const updateDto = { name: 'Bank Soal Kimia' } as UpdateQuestionBankDto;
      const updatedBank = new QuestionBank();
      updatedBank.id = bankId;
      updatedBank.name = 'Bank Soal Kimia';

      mockQuestionBankRepository.update.mockResolvedValue(undefined); // update doesn't return anything
      mockQuestionBankRepository.findOneBy.mockResolvedValue(updatedBank);

      const result = await service.update(bankId, updateDto);

      expect(result).toEqual(updatedBank);
      expect(questionBankRepository.update).toHaveBeenCalledWith(bankId, updateDto);
      expect(questionBankRepository.findOneBy).toHaveBeenCalledWith({ id: bankId });
    });
  });

  describe('remove', () => {
    it('should delete a question bank', async () => {
      const bankId = 1;
      mockQuestionBankRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(bankId);

      expect(questionBankRepository.delete).toHaveBeenCalledWith(bankId);
    });
  });
});