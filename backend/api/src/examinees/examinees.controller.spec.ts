// cbt-realtime-system/backend/api/src/examinees/examinees.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ExamineesController } from './examinees.controller';
import { ExamineesService } from './examinees.service';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';
import { Examinee } from './entities/examinee.entity';

// Membuat mock/tiruan dari ExamineesService dengan semua metodenya
const mockExamineesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllSimple: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ExamineesController', () => {
  let controller: ExamineesController;
  let service: ExamineesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamineesController],
      providers: [
        {
          provide: ExamineesService,
          useValue: mockExamineesService,
        },
      ],
    }).compile();

    controller = module.get<ExamineesController>(ExamineesController);
    service = module.get<ExamineesService>(ExamineesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new examinee', async () => {
      const createDto = { name: 'Citra' } as CreateExamineeDto;
      const createdExaminee = new Examinee();
      mockExamineesService.create.mockResolvedValue(createdExaminee);

      const result = await controller.create(createDto);

      expect(result).toEqual(createdExaminee);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated examinees', async () => {
      const paginatedResult = { data: [new Examinee()], total: 1, page: 1, last_page: 1 };
      mockExamineesService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll('1', '10');

      expect(result).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findAllSimple', () => {
    it('should return a simple list of examinees', async () => {
      const simpleList = [new Examinee()];
      mockExamineesService.findAllSimple.mockResolvedValue(simpleList);

      const result = await controller.findAllSimple();

      expect(result).toEqual(simpleList);
      expect(service.findAllSimple).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single examinee', async () => {
      const examineeId = '1';
      const singleExaminee = new Examinee();
      mockExamineesService.findOne.mockResolvedValue(singleExaminee);

      const result = await controller.findOne(examineeId);

      expect(result).toEqual(singleExaminee);
      expect(service.findOne).toHaveBeenCalledWith(+examineeId);
    });
  });

  describe('update', () => {
    it('should update an examinee', async () => {
      const examineeId = '1';
      const updateDto = { name: 'Dian' } as UpdateExamineeDto;
      const updatedExaminee = new Examinee();
      mockExamineesService.update.mockResolvedValue(updatedExaminee);

      const result = await controller.update(examineeId, updateDto);

      expect(result).toEqual(updatedExaminee);
      expect(service.update).toHaveBeenCalledWith(+examineeId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove an examinee', async () => {
      const examineeId = '1';
      mockExamineesService.remove.mockResolvedValue({ affected: 1 });

      await controller.remove(examineeId);

      expect(service.remove).toHaveBeenCalledWith(+examineeId);
    });
  });
});