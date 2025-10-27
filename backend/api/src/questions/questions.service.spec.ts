// cbt-realtime-system/backend/api/src/questions/questions.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Question, QuestionType } from './entities/question.entity';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionBank } from '../question-banks/entities/question-bank.entity';

// Membuat mock untuk QuestionRepository
const mockQuestionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: Repository<Question>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: getRepositoryToken(Question),
          useValue: mockQuestionRepository,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    repository = module.get<Repository<Question>>(getRepositoryToken(Question));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new question and associate it with a bank', async () => {
      // 1. Arrange
      const createDto: CreateQuestionDto = {
        bank_id: 1,
        question_text: 'Apa ibu kota Indonesia?',
        question_type: QuestionType.MULTIPLE_CHOICE,
        options: [{ key: 'A', text: 'Jakarta' }],
        correct_answer: 'A',
      };
      const newQuestion = new Question();

      mockQuestionRepository.create.mockReturnValue(newQuestion);
      mockQuestionRepository.save.mockResolvedValue({ newQuestion, id: 1 });

      // 2. Act
      const result = await service.create(createDto);

      // 3. Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        bank: { id: createDto.bank_id },
      });
      expect(repository.save).toHaveBeenCalledWith(newQuestion);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const mockQuestions = [new Question()];
      mockQuestionRepository.find.mockResolvedValue(mockQuestions);

      const result = await service.findAll();

      expect(result).toEqual(mockQuestions);
      expect(repository.find).toHaveBeenCalledWith({ relations: ['bank'] });
    });
  });

  describe('findOne', () => {
    it('should return a single question', async () => {
      const questionId = 1;
      const mockQuestion = new Question();
      mockQuestionRepository.findOneBy.mockResolvedValue(mockQuestion);

      const result = await service.findOne(questionId);

      expect(result).toEqual(mockQuestion);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: questionId });
    });
  });

  describe('update', () => {
    it('should update a question', async () => {
      const questionId = 1;
      const updateDto: UpdateQuestionDto = {
        question_text: 'Apa ibu kota Malaysia?',
      };
      const updatedQuestion = new Question();
      updatedQuestion.id = questionId;
      updatedQuestion.question_text = 'Apa ibu kota Malaysia?';

      mockQuestionRepository.update.mockResolvedValue(undefined);
      mockQuestionRepository.findOneBy.mockResolvedValue(updatedQuestion);

      const result = await service.update(questionId, updateDto);

      expect(result).toEqual(updatedQuestion);
      expect(repository.update).toHaveBeenCalledWith(questionId, {
        question_text: 'Apa ibu kota Malaysia?',
      });
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: questionId });
    });

    it('should update a question and its bank', async () => {
        const questionId = 1;
        const updateDto: UpdateQuestionDto = { bank_id: 2 };
        const payload = { bank: { id: 2 } };
  
        mockQuestionRepository.update.mockResolvedValue(undefined);
        mockQuestionRepository.findOneBy.mockResolvedValue(new Question());
  
        await service.update(questionId, updateDto);
  
        expect(repository.update).toHaveBeenCalledWith(questionId, payload);
      });
  });

  describe('remove', () => {
    it('should delete a question', async () => {
      const questionId = 1;
      mockQuestionRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(questionId);

      expect(repository.delete).toHaveBeenCalledWith(questionId);
    });
  });
});