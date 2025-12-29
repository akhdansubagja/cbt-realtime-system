// cbt-realtime-system/backend/api/src/questions/questions.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from './entities/question.entity';

// Membuat mock/tiruan dari QuestionsService dengan semua metodenya
const mockQuestionsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let service: QuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: mockQuestionsService,
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
    service = module.get<QuestionsService>(QuestionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new question', async () => {
      const createDto = new CreateQuestionDto();
      const createdQuestion = new Question();
      mockQuestionsService.create.mockResolvedValue(createdQuestion);

      const result = await controller.create(createDto);

      expect(result).toEqual(createdQuestion);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const allQuestions = [new Question()];
      mockQuestionsService.findAll.mockResolvedValue(allQuestions);

      const result = await controller.findAll();

      expect(result).toEqual(allQuestions);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single question', async () => {
      const questionId = 1;
      const singleQuestion = new Question();
      mockQuestionsService.findOne.mockResolvedValue(singleQuestion);

      const result = await controller.findOne(questionId);

      expect(result).toEqual(singleQuestion);
      expect(service.findOne).toHaveBeenCalledWith(questionId);
    });
  });

  describe('update', () => {
    it('should update a question', async () => {
      const questionId = 1;
      const updateDto = new UpdateQuestionDto();
      const updatedQuestion = new Question();
      mockQuestionsService.update.mockResolvedValue(updatedQuestion);

      const result = await controller.update(questionId, updateDto);

      expect(result).toEqual(updatedQuestion);
      expect(service.update).toHaveBeenCalledWith(questionId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a question', async () => {
      const questionId = 1;
      mockQuestionsService.remove.mockResolvedValue({ affected: 1 });

      await controller.remove(questionId);

      expect(service.remove).toHaveBeenCalledWith(questionId);
    });
  });
});
