// cbt-realtime-system/backend/api/src/exams/exams.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam } from './entities/exam.entity';

// Membuat mock/tiruan dari ExamsService dengan semua metodenya
const mockExamsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getParticipantsForExam: jest.fn(),
};

describe('ExamsController', () => {
  let controller: ExamsController;
  let service: ExamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamsController],
      providers: [
        {
          provide: ExamsService,
          useValue: mockExamsService,
        },
      ],
    }).compile();

    controller = module.get<ExamsController>(ExamsController);
    service = module.get<ExamsService>(ExamsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new exam', async () => {
      const createDto = new CreateExamDto(); // Asumsikan DTO valid
      const createdExam = new Exam();
      mockExamsService.create.mockResolvedValue(createdExam);

      const result = await controller.create(createDto);

      expect(result).toEqual(createdExam);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of exams', async () => {
      const allExams = [new Exam()];
      mockExamsService.findAll.mockResolvedValue(allExams);

      const result = await controller.findAll();

      expect(result).toEqual(allExams);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single exam', async () => {
      const examId = '1';
      const singleExam = new Exam();
      mockExamsService.findOne.mockResolvedValue(singleExam);

      const result = await controller.findOne(examId);

      expect(result).toEqual(singleExam);
      expect(service.findOne).toHaveBeenCalledWith(+examId);
    });
  });

  describe('update', () => {
    it('should update an exam', async () => {
      const examId = '1';
      const updateDto = new UpdateExamDto(); // Asumsikan DTO valid
      const updatedExam = new Exam();
      mockExamsService.update.mockResolvedValue(updatedExam);

      const result = await controller.update(examId, updateDto);

      expect(result).toEqual(updatedExam);
      expect(service.update).toHaveBeenCalledWith(+examId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove an exam', async () => {
      const examId = '1';
      mockExamsService.remove.mockResolvedValue({ affected: 1 });

      await controller.remove(examId);

      expect(service.remove).toHaveBeenCalledWith(+examId);
    });
  });

  describe('getParticipantsForExam', () => {
    it("should return an array of an exam's participants", async () => {
        const examId = '1';
        const participants = [/* data partisipan palsu */];
        mockExamsService.getParticipantsForExam.mockResolvedValue(participants);

        const result = await controller.getParticipantsForExam(examId);

        expect(result).toEqual(participants);
        expect(service.getParticipantsForExam).toHaveBeenCalledWith(+examId);
    });
  });
});